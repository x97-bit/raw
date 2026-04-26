import { appRouter } from "./routers";

async function main() {
  const systemRecord = (appRouter._def.record as any).system;
  console.log("System endpoints:");
  console.log(systemRecord);
}

main().catch(console.error);
