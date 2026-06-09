from beanie import Document, Indexed
from pydantic import Field
from typing import Optional
from datetime import datetime


class Stock(Document):
    """
    One document per listed stock.
    Price data from yfinance, fundamentals from yfinance info.
    """

    # ── Identity ──────────────────────────────────────────
    symbol: Indexed(str, unique=True)            # NSE symbol e.g. "RELIANCE"
    bse_code: Optional[str] = None              # BSE scrip code e.g. "500325"
    isin: Optional[str] = None
    company_name: str
    sector: Indexed(str)                         # e.g. "Energy"
    industry: Optional[str] = None              # e.g. "Oil & Gas"
    exchange: str = "NSE"

    # ── Price ─────────────────────────────────────────────
    current_price: Optional[float] = None
    open_price: Optional[float] = None
    high_52w: Optional[float] = None
    low_52w: Optional[float] = None
    prev_close: Optional[float] = None
    price_date: Optional[datetime] = None

    # ── Size ──────────────────────────────────────────────
    market_cap_cr: Optional[float] = None        # ₹ Crore
    market_cap_category: Optional[str] = None   # "Large", "Mid", "Small", "Micro"
    free_float_cr: Optional[float] = None

    # ── Returns (%) ───────────────────────────────────────
    return_1w: Optional[float] = None
    return_1m: Optional[float] = None
    return_3m: Optional[float] = None
    return_6m: Optional[float] = None
    return_1y: Optional[float] = None
    return_3y: Optional[float] = None           # annualised CAGR
    return_5y: Optional[float] = None           # annualised CAGR

    # ── Valuation ─────────────────────────────────────────
    pe_ratio: Optional[float] = None            # Trailing P/E
    forward_pe: Optional[float] = None
    pb_ratio: Optional[float] = None            # Price to Book
    ps_ratio: Optional[float] = None            # Price to Sales
    ev_ebitda: Optional[float] = None
    dividend_yield: Optional[float] = None      # %

    # ── Profitability ─────────────────────────────────────
    roe: Optional[float] = None                 # Return on Equity %
    roce: Optional[float] = None                # Return on Capital Employed %
    roa: Optional[float] = None                 # Return on Assets %
    net_profit_margin: Optional[float] = None   # %
    operating_margin: Optional[float] = None    # %
    ebitda_margin: Optional[float] = None       # %
    gross_margin: Optional[float] = None        # %

    # ── Growth ────────────────────────────────────────────
    revenue_growth_1y: Optional[float] = None   # YoY %
    revenue_growth_3y: Optional[float] = None   # 3Y CAGR %
    profit_growth_1y: Optional[float] = None
    profit_growth_3y: Optional[float] = None
    eps_growth_1y: Optional[float] = None
    eps_ttm: Optional[float] = None

    # ── Financial health ──────────────────────────────────
    debt_to_equity: Optional[float] = None
    current_ratio: Optional[float] = None
    interest_coverage: Optional[float] = None
    total_debt_cr: Optional[float] = None
    cash_cr: Optional[float] = None

    # ── Volume & technicals ───────────────────────────────
    volume: Optional[int] = None
    avg_volume_30d: Optional[int] = None
    relative_volume: Optional[float] = None     # volume / avg_volume
    rsi_14: Optional[float] = None
    above_sma_50: Optional[bool] = None
    above_sma_200: Optional[bool] = None
    pct_from_52w_high: Optional[float] = None   # % below 52W high
    pct_from_52w_low: Optional[float] = None    # % above 52W low

    # ── Ownership ─────────────────────────────────────────
    promoter_holding: Optional[float] = None    # %
    fii_holding: Optional[float] = None         # %
    dii_holding: Optional[float] = None         # %
    public_holding: Optional[float] = None      # %

    # ── Index membership ──────────────────────────────────
    in_nifty50: bool = False
    in_nifty100: bool = False
    in_nifty500: bool = False
    in_sensex: bool = False
    in_fnoflag: bool = False                    # F&O eligible

    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "stocks"
        indexes = [
            "sector",
            "market_cap_cr",
            "pe_ratio",
            "return_1y",
            "roe",
            "in_nifty50",
            "in_fnoflag",
        ]


class StockPriceHistory(Document):
    """Daily OHLCV for a stock. Used for return calculations."""
    symbol: Indexed(str)
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    adjusted_close: Optional[float] = None

    class Settings:
        name = "stock_price_history"
        indexes = [
            [("symbol", 1), ("date", -1)],
        ]
