from beanie import Document, Indexed
from pydantic import Field
from typing import Optional
from datetime import datetime


class MutualFund(Document):
    """
    One document per MF scheme.
    Updated daily after market close.
    All return fields are in % (e.g. 12.5 means 12.5%).
    """

    # ── Identity ──────────────────────────────────────────
    scheme_code: Indexed(str, unique=True)       # AMFI scheme code e.g. "120503"
    scheme_name: str
    amc: Indexed(str)                            # e.g. "HDFC Mutual Fund"
    amc_code: str
    category: Indexed(str)                       # e.g. "Equity", "Debt", "Hybrid"
    sub_category: Indexed(str)                   # e.g. "Large Cap", "Liquid"
    fund_type: str                               # "Open Ended" / "Close Ended"
    plan: str                                    # "Direct" / "Regular"
    option: str                                  # "Growth" / "IDCW"
    isin_growth: Optional[str] = None
    isin_div_reinvest: Optional[str] = None

    # ── NAV ───────────────────────────────────────────────
    nav: Optional[float] = None                  # Latest NAV (₹)
    nav_date: Optional[datetime] = None

    # ── Returns (%) ───────────────────────────────────────
    return_1w: Optional[float] = None
    return_1m: Optional[float] = None
    return_3m: Optional[float] = None
    return_6m: Optional[float] = None
    return_1y: Optional[float] = None
    return_2y: Optional[float] = None            # annualised
    return_3y: Optional[float] = None            # annualised
    return_5y: Optional[float] = None            # annualised
    return_10y: Optional[float] = None           # annualised
    return_since_inception: Optional[float] = None

    # ── Risk metrics ──────────────────────────────────────
    sharpe_ratio: Optional[float] = None         # 3Y rolling
    sortino_ratio: Optional[float] = None
    alpha: Optional[float] = None                # vs benchmark
    beta: Optional[float] = None
    standard_deviation: Optional[float] = None  # 3Y annualised (%)
    r_squared: Optional[float] = None

    # ── Fund details ──────────────────────────────────────
    aum_cr: Optional[float] = None               # AUM in ₹ Crore
    expense_ratio: Optional[float] = None        # % e.g. 0.5
    exit_load: Optional[str] = None             # e.g. "1% if redeemed within 1Y"
    lock_in_years: Optional[float] = None        # 0 for most, 3 for ELSS
    min_sip_amount: Optional[float] = None
    min_lumpsum_amount: Optional[float] = None
    benchmark: Optional[str] = None             # e.g. "Nifty 50 TRI"
    fund_manager: Optional[str] = None

    # ── Screener helpers ──────────────────────────────────
    is_direct: bool = False                      # True if Direct plan
    is_growth: bool = True                       # True if Growth option
    is_active: bool = True

    # ── Timestamps ────────────────────────────────────────
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "mutual_funds"
        indexes = [
            "amc",
            "category",
            "sub_category",
            "return_1y",
            "return_3y",
            "aum_cr",
            "expense_ratio",
            "sharpe_ratio",
        ]


class MFNavHistory(Document):
    """
    Daily NAV history for a scheme.
    Used for return & risk calculations.
    """
    scheme_code: Indexed(str)
    date: datetime
    nav: float

    class Settings:
        name = "mf_nav_history"
        indexes = [
            [("scheme_code", 1), ("date", -1)],   # compound index
        ]
