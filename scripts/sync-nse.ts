import { syncNseMarketData } from "../src/server/connectors/nse";

(async () => {
  await syncNseMarketData();
})();
