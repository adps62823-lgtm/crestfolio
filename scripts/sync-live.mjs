const { syncLiveSources } = await import("../src/server/connectors/index.ts");

const source = process.argv[2];
const results = await syncLiveSources(source);
console.log(JSON.stringify(results, null, 2));
