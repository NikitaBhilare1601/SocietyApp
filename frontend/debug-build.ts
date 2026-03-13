console.log("DEBUG: Simple build script started");
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
console.log("DEBUG: fs and fs/promises imported");
import path from "node:path";
console.log("DEBUG: path imported");

const outdir = path.resolve(process.cwd(), "dist");
console.log("DEBUG: outdir is", outdir);

if (existsSync(outdir)) {
    console.log("DEBUG: outdir exists");
} else {
    console.log("DEBUG: outdir does not exist");
}

console.log("DEBUG: Simple build script completed");
await Promise.resolve();
console.log("DEBUG: Async module completion");
