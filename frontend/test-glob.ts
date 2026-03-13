import { existsSync } from "node:fs";
import path from "node:path";
console.log("Testing Bun.Glob...");
try {
  const glob = new Bun.Glob("**.html");
  console.log("**.html glob created");
  const files = [...glob.scanSync("src")];
  console.log("files scanned:", files);
} catch (e) {
  console.error("Globt test failed:", e);
}
