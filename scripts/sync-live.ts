import { syncLiveSources } from "../src/server/connectors";

async function main() {
  const source = process.argv[2];
  const results = await syncLiveSources(source);
  console.log(JSON.stringify(results, null, 2));
}

void main();
