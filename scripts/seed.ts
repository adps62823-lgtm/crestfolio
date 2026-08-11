import { seedDatabase } from "../src/server/seed";

async function main() {
  await seedDatabase();
}

void main();
