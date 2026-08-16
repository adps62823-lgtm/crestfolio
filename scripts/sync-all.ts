import { syncAmfiNavs } from "../src/server/connectors/amfi";
import { syncNseMarketData } from "../src/server/connectors/nse";
import { syncMcxData } from "../src/server/connectors/mcx";
import { syncMospiCpi } from "../src/server/connectors/mospi";
import { syncRbiRates } from "../src/server/connectors/rbi";

(async () => {
  console.log("Crestfolio — full live sync starting...");
  await syncAmfiNavs();
  await syncNseMarketData();
  await syncMcxData();
  await syncMospiCpi();
  await syncRbiRates();
  console.log("✓ Sync complete.");
})();
