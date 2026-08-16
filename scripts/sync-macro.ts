import { syncMospiCpi } from "../src/server/connectors/mospi";
import { syncRbiRates } from "../src/server/connectors/rbi";

(async () => {
  await syncMospiCpi();
  await syncRbiRates();
})();
