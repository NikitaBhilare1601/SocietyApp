import path from "path";

const outdir = path.resolve(process.cwd(), "dist-test");
const entrypoints = [path.join(process.cwd(), "src", "main.tsx")];

console.log("🚀 Starting minimal build test...");

const result = await Bun.build({
  entrypoints,
  outdir,
  minify: false,
  target: "browser",
  sourcemap: "none",
});

if (!result.success) {
  console.error("❌ Build failed!");
  for (const log of result.logs) {
    console.error(log);
  }
} else {
  console.log("✅ Minimal build success!");
}
