"""
Stock Data Pipeline
────────────────────
Source: yfinance (free, no auth needed)
Covers: NSE listed stocks (.NS suffix)

Run manually:  python -m app.pipeline.stock_pipeline
Run via task:  called by Celery beat daily after market close
"""

import asyncio
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential
import httpx

from app.core.database import connect_db, disconnect_db
from app.models.stock import Stock, StockPriceHistory


# ── NSE stock list ─────────────────────────────────────────────────────────────

NSE_SYMBOLS_URL = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv"

# Nifty indices membership (hardcoded for reliability, update quarterly)
NIFTY50 = {
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "HINDUNILVR", "ICICIBANK", "KOTAKBANK",
    "SBIN", "BHARTIARTL", "ITC", "AXISBANK", "LT", "WIPRO", "HCLTECH", "ASIANPAINT",
    "MARUTI", "BAJFINANCE", "TITAN", "NESTLEIND", "ULTRACEMCO", "POWERGRID",
    "SUNPHARMA", "TECHM", "NTPC", "ONGC", "COALINDIA", "BAJAJFINSV", "JSWSTEEL",
    "ADANIENT", "ADANIPORTS", "TATAMOTORS", "TATASTEEL", "DIVISLAB", "CIPLA",
    "DRREDDY", "BRITANNIA", "EICHERMOT", "HEROMOTOCO", "BPCL", "GRASIM",
    "APOLLOHOSP", "BAJAJ-AUTO", "SBILIFE", "HDFCLIFE", "HINDALCO", "M&M",
    "TATACONSUM", "INDUSINDBK", "UPL", "SHREECEM",
}

NIFTY100_EXTRA = {
    "GODREJCP", "DABUR", "PIDILITIND", "SIEMENS", "ABB", "AMBUJACEM", "ACC",
    "GAIL", "IOC", "ADANIGREEN", "ADANITRANS", "NAUKRI", "DMART", "VEDL",
    "HAVELLS", "MUTHOOTFIN", "CHOLAFIN", "BERGERPAINTS", "LUPIN", "TORNTPHARM",
    "BIOCON", "AUROPHARMA", "IPCALAB", "ALKEM", "GLAXO", "PFIZER",
    "BANDHANBNK", "RBLBANK", "FEDERALBNK", "PNB", "CANBK", "BANKBARODA",
    "TRENT", "PAGEIND", "WHIRLPOOL", "COLPAL", "MARICO",
    "SAIL", "NMDC", "NATIONALUM",
}


def get_market_cap_category(market_cap_cr: float | None) -> str | None:
    if market_cap_cr is None:
        return None
    if market_cap_cr >= 20000:
        return "Large"
    if market_cap_cr >= 5000:
        return "Mid"
    if market_cap_cr >= 500:
        return "Small"
    return "Micro"


def compute_rsi(prices: pd.Series, period: int = 14) -> float | None:
    if len(prices) < period + 1:
        return None
    delta = prices.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    val = rsi.iloc[-1]
    return round(float(val), 2) if not np.isnan(val) else None


def compute_cagr(prices: pd.Series, years: float) -> float | None:
    if len(prices) < 2 or years <= 0:
        return None
    start = prices.iloc[0]
    end = prices.iloc[-1]
    if start <= 0:
        return None
    return round(((end / start) ** (1 / years) - 1) * 100, 2)


async def fetch_nse_symbol_list() -> list[str]:
    """Fetch all NSE equity symbols from NSE archives."""
    logger.info("Fetching NSE symbol list...")
    try:
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
            resp = await client.get(NSE_SYMBOLS_URL, timeout=30)
            resp.raise_for_status()

        from io import StringIO
        df = pd.read_csv(StringIO(resp.text))
        symbols = df["SYMBOL"].dropna().tolist()
        logger.info(f"Found {len(symbols)} NSE symbols")
        return symbols
    except Exception as e:
        logger.warning(f"Could not fetch NSE symbol list: {e}. Using fallback list.")
        # Fallback: use Nifty 500 representative set
        return list(NIFTY50 | NIFTY100_EXTRA)


def process_stock_data(symbol: str, ticker: yf.Ticker) -> dict | None:
    """Extract all screener fields from a yfinance Ticker object."""
    try:
        info = ticker.info
        if not info or info.get("regularMarketPrice") is None:
            return None

        hist = ticker.history(period="5y")
        if hist.empty:
            return None

        closes = hist["Close"]
        latest_close = float(closes.iloc[-1])
        today = closes.index[-1]

        # Returns
        def pct_return(days):
            target = today - timedelta(days=days)
            past = closes[closes.index <= target]
            if past.empty:
                return None
            past_val = float(past.iloc[-1])
            if past_val <= 0:
                return None
            if days > 365:
                years = days / 365
                return round(((latest_close / past_val) ** (1 / years) - 1) * 100, 2)
            return round(((latest_close - past_val) / past_val) * 100, 2)

        market_cap = info.get("marketCap")
        market_cap_cr = round(market_cap / 1e7, 2) if market_cap else None  # convert to crore

        sma_50 = closes.rolling(50).mean().iloc[-1] if len(closes) >= 50 else None
        sma_200 = closes.rolling(200).mean().iloc[-1] if len(closes) >= 200 else None

        high_52w = float(closes[-252:].max()) if len(closes) >= 252 else float(closes.max())
        low_52w = float(closes[-252:].min()) if len(closes) >= 252 else float(closes.min())

        return {
            "symbol": symbol,
            "company_name": info.get("longName") or info.get("shortName") or symbol,
            "sector": info.get("sector") or "Unknown",
            "industry": info.get("industry"),
            "exchange": "NSE",
            "isin": info.get("isin"),

            # Price
            "current_price": latest_close,
            "open_price": info.get("open"),
            "high_52w": high_52w,
            "low_52w": low_52w,
            "prev_close": info.get("previousClose"),
            "price_date": today.to_pydatetime(),

            # Size
            "market_cap_cr": market_cap_cr,
            "market_cap_category": get_market_cap_category(market_cap_cr),

            # Returns
            "return_1w": pct_return(7),
            "return_1m": pct_return(30),
            "return_3m": pct_return(91),
            "return_6m": pct_return(182),
            "return_1y": pct_return(365),
            "return_3y": pct_return(1095),
            "return_5y": pct_return(1825),

            # Valuation
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "pb_ratio": info.get("priceToBook"),
            "ps_ratio": info.get("priceToSalesTrailing12Months"),
            "ev_ebitda": info.get("enterpriseToEbitda"),
            "dividend_yield": round(info.get("dividendYield", 0) * 100, 2) if info.get("dividendYield") else None,

            # Profitability
            "roe": round(info.get("returnOnEquity", 0) * 100, 2) if info.get("returnOnEquity") else None,
            "roa": round(info.get("returnOnAssets", 0) * 100, 2) if info.get("returnOnAssets") else None,
            "net_profit_margin": round(info.get("profitMargins", 0) * 100, 2) if info.get("profitMargins") else None,
            "operating_margin": round(info.get("operatingMargins", 0) * 100, 2) if info.get("operatingMargins") else None,
            "gross_margin": round(info.get("grossMargins", 0) * 100, 2) if info.get("grossMargins") else None,

            # Growth
            "revenue_growth_1y": round(info.get("revenueGrowth", 0) * 100, 2) if info.get("revenueGrowth") else None,
            "eps_ttm": info.get("trailingEps"),

            # Financial health
            "debt_to_equity": info.get("debtToEquity"),
            "current_ratio": info.get("currentRatio"),
            "total_debt_cr": round(info.get("totalDebt", 0) / 1e7, 2) if info.get("totalDebt") else None,
            "cash_cr": round(info.get("totalCash", 0) / 1e7, 2) if info.get("totalCash") else None,

            # Volume & technicals
            "volume": info.get("volume"),
            "avg_volume_30d": info.get("averageVolume"),
            "rsi_14": compute_rsi(closes),
            "above_sma_50": bool(latest_close > float(sma_50)) if sma_50 and not np.isnan(sma_50) else None,
            "above_sma_200": bool(latest_close > float(sma_200)) if sma_200 and not np.isnan(sma_200) else None,
            "pct_from_52w_high": round((latest_close - high_52w) / high_52w * 100, 2) if high_52w else None,
            "pct_from_52w_low": round((latest_close - low_52w) / low_52w * 100, 2) if low_52w else None,

            # Index membership
            "in_nifty50": symbol in NIFTY50,
            "in_nifty100": symbol in (NIFTY50 | NIFTY100_EXTRA),
            "in_nifty500": True,  # populated from symbol list

            "is_active": True,
            "updated_at": datetime.utcnow(),
        }
    except Exception as e:
        logger.warning(f"Error processing {symbol}: {e}")
        return None


async def run_stock_pipeline(symbols: list[str] | None = None):
    """
    Fetch and upsert stock data for all NSE symbols.
    Runs in a thread pool since yfinance is synchronous.
    """
    logger.info("Starting stock pipeline...")
    start = datetime.utcnow()

    if symbols is None:
        symbols = await fetch_nse_symbol_list()

    processed = 0
    errors = 0
    semaphore = asyncio.Semaphore(5)  # conservative limit for yfinance

    async def process_symbol(sym: str):
        nonlocal processed, errors
        async with semaphore:
            try:
                loop = asyncio.get_event_loop()
                ticker = await loop.run_in_executor(
                    None, lambda: yf.Ticker(f"{sym}.NS")
                )
                data = await loop.run_in_executor(
                    None, lambda: process_stock_data(sym, ticker)
                )

                if data:
                    await Stock.find_one(Stock.symbol == sym).upsert(
                        {"$set": data},
                        on_insert=Stock(**data),
                    )
                    processed += 1

                    # Save price history
                    hist = await loop.run_in_executor(
                        None, lambda: ticker.history(period="5y")
                    )
                    if not hist.empty:
                        for date, row in hist.iterrows():
                            await StockPriceHistory.find_one(
                                StockPriceHistory.symbol == sym,
                                StockPriceHistory.date == date.to_pydatetime(),
                            ).upsert(
                                {"$set": {"close": float(row["Close"]), "volume": int(row["Volume"])}},
                                on_insert=StockPriceHistory(
                                    symbol=sym,
                                    date=date.to_pydatetime(),
                                    open=float(row["Open"]),
                                    high=float(row["High"]),
                                    low=float(row["Low"]),
                                    close=float(row["Close"]),
                                    volume=int(row["Volume"]),
                                    adjusted_close=float(row.get("Adj Close", row["Close"])),
                                ),
                            )
                else:
                    errors += 1

                if processed % 50 == 0:
                    logger.info(f"Stocks: {processed} done, {errors} errors")

            except Exception as e:
                logger.error(f"Failed {sym}: {e}")
                errors += 1

    await asyncio.gather(*[process_symbol(s) for s in symbols])

    duration = (datetime.utcnow() - start).seconds
    logger.info(f"Stock pipeline done: {processed} processed, {errors} errors in {duration}s")


if __name__ == "__main__":
    import sys

    async def main():
        await connect_db()
        symbols = None
        # Pass specific symbols as args: python -m app.pipeline.stock_pipeline RELIANCE TCS
        if len(sys.argv) > 1 and not sys.argv[1].startswith("--"):
            symbols = sys.argv[1:]
        await run_stock_pipeline(symbols)
        await disconnect_db()

    asyncio.run(main())
