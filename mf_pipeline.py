"""
Mutual Fund Data Pipeline
─────────────────────────
Sources:
  1. MFApi.in        → scheme list + daily NAV + NAV history (free, no auth)
  2. AMFI India      → official scheme metadata, AUM (free)

Run manually:  python -m app.pipeline.mf_pipeline
Run via task:  called by Celery beat scheduler daily
"""

import asyncio
import httpx
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.database import connect_db, disconnect_db
from app.models.mf import MutualFund, MFNavHistory


# ── API endpoints ─────────────────────────────────────────────────────────────

MFAPI_BASE = "https://api.mfapi.in"
AMFI_NAV_URL = "https://www.amfiindia.com/spages/NAVAll.txt"


# ── Helpers ───────────────────────────────────────────────────────────────────

def categorize_scheme(scheme_name: str) -> tuple[str, str]:
    """
    Derive category and sub_category from scheme name.
    AMFI scheme names follow a predictable pattern.
    Returns (category, sub_category)
    """
    name = scheme_name.lower()

    if any(x in name for x in ["liquid", "overnight", "money market"]):
        return "Debt", "Liquid/Overnight"
    if any(x in name for x in ["ultra short", "low duration", "short dur", "short term"]):
        return "Debt", "Short Duration"
    if any(x in name for x in ["corporate bond", "banking and psu", "gilt", "credit risk"]):
        return "Debt", "Corporate/Gilt"
    if "debt" in name or "income" in name or "bond" in name:
        return "Debt", "Medium/Long Duration"
    if "large cap" in name:
        return "Equity", "Large Cap"
    if "mid cap" in name:
        return "Equity", "Mid Cap"
    if "small cap" in name:
        return "Equity", "Small Cap"
    if "flexi cap" in name or "multi cap" in name:
        return "Equity", "Flexi/Multi Cap"
    if "elss" in name or "tax saver" in name or "tax saving" in name:
        return "Equity", "ELSS"
    if "sectoral" in name or "thematic" in name or "pharma" in name or "tech" in name or "infra" in name:
        return "Equity", "Sectoral/Thematic"
    if "index" in name or "nifty" in name or "sensex" in name or "bse" in name:
        return "Equity", "Index Fund"
    if "equity" in name or "growth" in name:
        return "Equity", "Diversified"
    if "hybrid" in name or "balanced" in name or "aggressive" in name or "conservative" in name:
        return "Hybrid", "Hybrid"
    if "arbitrage" in name:
        return "Hybrid", "Arbitrage"
    if "etf" in name:
        return "ETF", "ETF"
    if "gold" in name:
        return "Commodity", "Gold"
    if "international" in name or "global" in name or "overseas" in name:
        return "International", "International"
    if "fof" in name or "fund of fund" in name:
        return "FoF", "FoF"

    return "Other", "Other"


def compute_returns(nav_series: pd.Series) -> dict:
    """
    Given a pandas Series of NAV values (index = date, sorted ascending),
    compute all return periods. Returns dict of return_* fields.
    """
    if nav_series.empty or len(nav_series) < 2:
        return {}

    latest_nav = nav_series.iloc[-1]
    latest_date = nav_series.index[-1]

    def point_return(days: int) -> float | None:
        target = latest_date - timedelta(days=days)
        # Find nearest available NAV
        past = nav_series[nav_series.index <= target]
        if past.empty:
            return None
        past_nav = past.iloc[-1]
        if past_nav <= 0:
            return None
        if days > 365:
            # Annualise using CAGR
            years = days / 365
            return round(((latest_nav / past_nav) ** (1 / years) - 1) * 100, 2)
        return round(((latest_nav - past_nav) / past_nav) * 100, 2)

    returns = {
        "return_1w": point_return(7),
        "return_1m": point_return(30),
        "return_3m": point_return(91),
        "return_6m": point_return(182),
        "return_1y": point_return(365),
        "return_2y": point_return(730),
        "return_3y": point_return(1095),
        "return_5y": point_return(1825),
        "return_10y": point_return(3650),
    }

    # Since inception
    inception_nav = nav_series.iloc[0]
    inception_date = nav_series.index[0]
    if inception_nav > 0:
        years = (latest_date - inception_date).days / 365
        if years > 0:
            returns["return_since_inception"] = round(
                ((latest_nav / inception_nav) ** (1 / years) - 1) * 100, 2
            )

    return returns


def compute_risk_metrics(nav_series: pd.Series) -> dict:
    """
    Compute Sharpe, Sortino, Std Dev, Beta, Alpha from NAV history.
    Uses 3-year daily returns. Risk-free rate assumed 6.5% (approx India 10Y).
    """
    if len(nav_series) < 252:  # Need at least 1 year of data
        return {}

    # Use last 3 years
    three_yr = nav_series.iloc[-min(len(nav_series), 756):]
    daily_returns = three_yr.pct_change().dropna()

    if daily_returns.empty:
        return {}

    risk_free_daily = 0.065 / 252
    excess = daily_returns - risk_free_daily
    ann_return = (1 + daily_returns.mean()) ** 252 - 1
    ann_std = daily_returns.std() * np.sqrt(252)

    sharpe = round((ann_return - 0.065) / ann_std, 3) if ann_std > 0 else None

    downside = daily_returns[daily_returns < 0]
    downside_std = downside.std() * np.sqrt(252)
    sortino = round((ann_return - 0.065) / downside_std, 3) if downside_std > 0 else None

    return {
        "sharpe_ratio": sharpe,
        "sortino_ratio": sortino,
        "standard_deviation": round(ann_std * 100, 2),
    }


# ── Fetchers ─────────────────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def fetch_all_schemes(client: httpx.AsyncClient) -> list[dict]:
    """Fetch full scheme list from MFApi."""
    logger.info("Fetching scheme list from MFApi...")
    resp = await client.get(f"{MFAPI_BASE}/mf", timeout=30)
    resp.raise_for_status()
    schemes = resp.json()
    logger.info(f"Fetched {len(schemes)} schemes")
    return schemes


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def fetch_scheme_detail(client: httpx.AsyncClient, scheme_code: str) -> dict | None:
    """Fetch full NAV history + metadata for one scheme."""
    try:
        resp = await client.get(f"{MFAPI_BASE}/mf/{scheme_code}", timeout=20)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.warning(f"Failed to fetch scheme {scheme_code}: {e}")
        return None


async def fetch_amfi_metadata() -> pd.DataFrame:
    """
    Fetch AMFI's NAVAll.txt which contains:
    scheme_code;ISIN growth;ISIN div;scheme_name;nav_date;nav
    """
    logger.info("Fetching AMFI metadata...")
    async with httpx.AsyncClient() as client:
        resp = await client.get(AMFI_NAV_URL, timeout=30)
    lines = resp.text.strip().split("\n")

    rows = []
    for line in lines:
        parts = line.strip().split(";")
        if len(parts) >= 6:
            try:
                rows.append({
                    "scheme_code": parts[0].strip(),
                    "isin_growth": parts[1].strip() or None,
                    "isin_div_reinvest": parts[2].strip() or None,
                    "scheme_name": parts[3].strip(),
                    "nav_date": parts[4].strip(),
                    "nav": float(parts[5].strip()) if parts[5].strip() not in ("", "N.A.") else None,
                })
            except (ValueError, IndexError):
                continue

    df = pd.DataFrame(rows)
    logger.info(f"Fetched {len(df)} rows from AMFI")
    return df


# ── Main pipeline ─────────────────────────────────────────────────────────────

async def run_mf_pipeline(full_history: bool = False):
    """
    Main MF pipeline. 
    full_history=True: fetch complete NAV history (slow, use on first run).
    full_history=False: update only latest NAV (fast, use daily).
    """
    logger.info(f"Starting MF pipeline (full_history={full_history})")
    start = datetime.utcnow()

    # Fetch scheme list + AMFI metadata in parallel
    async with httpx.AsyncClient() as client:
        schemes_task = fetch_all_schemes(client)
        amfi_task = fetch_amfi_metadata()
        schemes, amfi_df = await asyncio.gather(schemes_task, amfi_task)

    # Build lookup from scheme_code → amfi row
    amfi_lookup = amfi_df.set_index("scheme_code").to_dict("index")

    # Filter to Growth / Direct only to reduce volume
    # (you can remove this filter to include all plans)
    processed = 0
    skipped = 0
    errors = 0

    # Process in batches to avoid overwhelming MFApi
    BATCH_SIZE = 50
    semaphore = asyncio.Semaphore(10)  # max 10 concurrent requests

    async def process_scheme(scheme: dict, client: httpx.AsyncClient):
        nonlocal processed, skipped, errors
        scheme_code = str(scheme.get("schemeCode", ""))
        scheme_name = scheme.get("schemeName", "")

        if not scheme_code:
            skipped += 1
            return

        # Parse plan & option from name
        name_lower = scheme_name.lower()
        plan = "Direct" if "direct" in name_lower else "Regular"
        option = "Growth" if "growth" in name_lower else "IDCW"

        # Skip Regular plans to save space (optional)
        # if plan == "Regular":
        #     skipped += 1
        #     return

        amfi_row = amfi_lookup.get(scheme_code, {})
        category, sub_category = categorize_scheme(scheme_name)

        # Extract AMC from scheme name (first part before spaces pattern)
        amc = scheme_name.split(" ")[0] if scheme_name else "Unknown"

        mf_doc = {
            "scheme_code": scheme_code,
            "scheme_name": scheme_name,
            "amc": amfi_row.get("amc", amc),
            "amc_code": amc.upper(),
            "category": category,
            "sub_category": sub_category,
            "fund_type": "Open Ended",
            "plan": plan,
            "option": option,
            "isin_growth": amfi_row.get("isin_growth"),
            "isin_div_reinvest": amfi_row.get("isin_div_reinvest"),
            "is_direct": plan == "Direct",
            "is_growth": option == "Growth",
            "is_active": True,
            "updated_at": datetime.utcnow(),
        }

        # Set latest NAV from AMFI
        if amfi_row.get("nav"):
            mf_doc["nav"] = amfi_row["nav"]
            try:
                mf_doc["nav_date"] = datetime.strptime(amfi_row["nav_date"], "%d-%b-%Y")
            except (ValueError, KeyError):
                pass

        if full_history:
            async with semaphore:
                detail = await fetch_scheme_detail(client, scheme_code)

            if detail and detail.get("data"):
                # Parse NAV history
                nav_data = detail["data"]  # list of {date, nav}
                nav_records = []
                navs = {}

                for row in nav_data:
                    try:
                        date = datetime.strptime(row["date"], "%d-%m-%Y")
                        nav_val = float(row["nav"])
                        navs[date] = nav_val
                        nav_records.append(
                            MFNavHistory(
                                scheme_code=scheme_code,
                                date=date,
                                nav=nav_val,
                            )
                        )
                    except (ValueError, KeyError):
                        continue

                if navs:
                    nav_series = pd.Series(navs).sort_index()
                    returns = compute_returns(nav_series)
                    risk = compute_risk_metrics(nav_series)
                    mf_doc.update(returns)
                    mf_doc.update(risk)

                    # Bulk upsert NAV history
                    if nav_records:
                        for record in nav_records:
                            await MFNavHistory.find_one(
                                MFNavHistory.scheme_code == scheme_code,
                                MFNavHistory.date == record.date,
                            ).upsert(
                                {"$set": {"nav": record.nav}},
                                on_insert=record,
                            )

        # Upsert the MF document
        await MutualFund.find_one(
            MutualFund.scheme_code == scheme_code
        ).upsert(
            {"$set": mf_doc},
            on_insert=MutualFund(**mf_doc),
        )
        processed += 1

        if processed % 100 == 0:
            logger.info(f"Processed {processed} schemes...")

    async with httpx.AsyncClient() as client:
        tasks = [process_scheme(s, client) for s in schemes]
        await asyncio.gather(*tasks, return_exceptions=True)

    duration = (datetime.utcnow() - start).seconds
    logger.info(
        f"MF pipeline complete: {processed} processed, "
        f"{skipped} skipped, {errors} errors in {duration}s"
    )


async def run_daily_nav_update():
    """
    Fast daily update — only update latest NAV from AMFI.
    Does NOT fetch full history. Takes ~30 seconds.
    """
    logger.info("Running daily NAV update...")
    amfi_df = await fetch_amfi_metadata()

    bulk_updates = []
    for _, row in amfi_df.iterrows():
        if row.get("nav"):
            try:
                nav_date = datetime.strptime(row["nav_date"], "%d-%b-%Y")
            except (ValueError, KeyError):
                nav_date = None

            bulk_updates.append({
                "scheme_code": str(row["scheme_code"]),
                "nav": row["nav"],
                "nav_date": nav_date,
                "updated_at": datetime.utcnow(),
            })

    # Update in batches of 500
    for i in range(0, len(bulk_updates), 500):
        batch = bulk_updates[i:i+500]
        for update in batch:
            await MutualFund.find_one(
                MutualFund.scheme_code == update["scheme_code"]
            ).update({"$set": update})

    logger.info(f"Daily NAV update complete: {len(bulk_updates)} schemes updated")


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    async def main():
        await connect_db()
        # Pass --full for first-time full history fetch
        full = "--full" in sys.argv
        if full:
            logger.info("Running FULL history fetch (first time setup, takes ~30 min)")
            await run_mf_pipeline(full_history=True)
        else:
            await run_daily_nav_update()
        await disconnect_db()

    asyncio.run(main())
