import path from "node:path";
import { Glob } from "bun";

const entrypoints = [...new Glob("**.html").scanSync("src")]
  .map(a => "./" + path.join("src", a).replaceAll("\\", "/"))
  .filter(dir => !dir.includes("node_modules"));

console.log("Evaluated entrypoints:", entrypoints);
