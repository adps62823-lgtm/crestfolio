import { syncAmfiNavs } from "./amfi";
import { syncMcxData } from "./mcx";
import { syncMospiCpi } from "./mospi";
import { syncNseMarketData } from "./nse";
import { syncRbiRates } from "./rbi";

export async function syncLiveSources(source?: string) {
  const sources = source ? [source] : ["amfi", "nse", "mcx", "rbi", "mospi"];
  const results = [];

  for (const item of sources) {
    if (item === "amfi") results.push(await syncAmfiNavs());
    if (item === "nse") results.push(await syncNseMarketData());
    if (item === "mcx") results.push(await syncMcxData());
    if (item === "rbi") results.push(await syncRbiRates());
    if (item === "mospi") results.push(await syncMospiCpi());
  }

  return results;
}
