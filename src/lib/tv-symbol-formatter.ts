export function formatTradingViewSymbol(symbol: string, _name?: string): string {
  if (!symbol) return "NSE:NIFTY";

  const rawSym = symbol.trim().toUpperCase().replace(/-/g, "").replace(/_/g, "");

  // Index / Commodity / FX explicit mappings
  if (rawSym.includes("NIFTY50") || rawSym === "NIFTY" || rawSym === "NIFTY50INDEX") return "NSE:NIFTY";
  if (rawSym.includes("BANKNIFTY")) return "NSE:BANKNIFTY";
  if (rawSym.includes("FINNIFTY")) return "NSE:FINNIFTY";
  if (rawSym.includes("VIX") || rawSym === "INDIAVIX") return "NSE:INDIAVIX";
  if (rawSym === "GOLD") return "MCX:GOLD1!";
  if (rawSym === "SILVER") return "MCX:SILVER1!";
  if (rawSym === "CRUDEOIL" || rawSym === "CRUDE") return "MCX:CRUDEOIL1!";
  if (rawSym === "USDINR" || rawSym === "USD/INR") return "FX_IDC:USDINR";

  // Mutual funds / Funds map to benchmark ETF (e.g. NIFTYBEES)
  if (
    rawSym.includes("PARAGPARIKH") ||
    rawSym.includes("FLEXICAP") ||
    rawSym.includes("MUTUAL") ||
    rawSym.includes("FUND") ||
    rawSym.includes("SCHEME")
  ) {
    return "NSE:NIFTYBEES";
  }

  // Common Indian equity symbol alias dictionary
  const stockMap: Record<string, string> = {
    RELIANCE: "NSE:RELIANCE",
    RELIANCEINDUSTRIES: "NSE:RELIANCE",
    HDFCBANK: "NSE:HDFCBANK",
    HDFC: "NSE:HDFCBANK",
    TCS: "NSE:TCS",
    INFY: "NSE:INFY",
    INFOSYS: "NSE:INFY",
    ITC: "NSE:ITC",
    SBIN: "NSE:SBIN",
    SBI: "NSE:SBIN",
    STATEBANKOFINDIA: "NSE:SBIN",
    BHARTIARTL: "NSE:BHARTIARTL",
    AIRTEL: "NSE:BHARTIARTL",
    LT: "NSE:LT",
    LARSENTOUBRO: "NSE:LT",
    TITAN: "NSE:TITAN",
    MARUTI: "NSE:MARUTI",
    SUNPHARMA: "NSE:SUNPHARMA",
    ICICIBANK: "NSE:ICICIBANK",
    TATAMOTORS: "NSE:TATAMOTORS",
    AXISBANK: "NSE:AXISBANK",
    KOTAKBANK: "NSE:KOTAKBANK",
    BAJFINANCE: "NSE:BAJFINANCE",
    ULTRACEMCO: "NSE:ULTRACEMCO",
    WIPRO: "NSE:WIPRO",
    HCLTECH: "NSE:HCLTECH",
    HAL: "NSE:HAL",
    BEL: "NSE:BEL",
    ZOMATO: "NSE:ZOMATO",
    SUZLON: "NSE:SUZLON",
    POLYCAB: "NSE:POLYCAB",
    DIXON: "NSE:DIXON",
    ADANIENT: "NSE:ADANIENT",
    ADANIPORTS: "NSE:ADANIPORTS",
    JSWSTEEL: "NSE:JSWSTEEL",
    TATASTEEL: "NSE:TATASTEEL",
  };

  if (stockMap[rawSym]) return stockMap[rawSym];

  if (rawSym.startsWith("NSE:") || rawSym.startsWith("BSE:") || rawSym.startsWith("MCX:")) {
    return rawSym;
  }

  const cleanSym = rawSym.replace(/[^A-Z]/g, "");
  return cleanSym ? `NSE:${cleanSym}` : "NSE:NIFTY";
}
