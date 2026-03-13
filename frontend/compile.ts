#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";

console.log("\n🚀 Starting build process...\n");

const outdir = path.resolve(process.cwd(), "dist");

if (existsSync(outdir)) {
  console.log(`🗑️ Cleaning previous build at ${outdir}`);
  await rm(outdir, { recursive: true, force: true });
}

// Build Tailwind CSS using native Node execution
console.log("🎨 Processing CSS with Tailwind...");
import { execSync } from "node:child_process";
try {
  execSync("node ./node_modules/@tailwindcss/cli/dist/index.mjs -i ./src/styles/globals.css -o ./dist/index.css --minify", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Tailwind build failed!");
  process.exit(1);
}

import { cpSync, watch } from "node:fs";

const build = async () => {
  const start = performance.now();
  
  // Important: Convert backslashes to forward slashes for Bun.build on Windows
  const entrypoints = [...new Bun.Glob("**.html").scanSync("src")]
    .map(a => "./" + path.join("src", a).replaceAll("\\", "/"))
    .filter(dir => !dir.includes("node_modules"));
    
  console.log(`📄 Processing ${entrypoints.length} HTML ${entrypoints.length === 1 ? "file" : "files"}...`);

  const result = await Bun.build({
    entrypoints,
    outdir,
    minify: !process.argv.includes("--dev"),
    target: "browser",
    sourcemap: "linked",
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.argv.includes("--dev") ? "development" : "production"),
      ...Object.fromEntries(
        Object.entries(process.env)
          .filter(([key]) => key.startsWith("VITE_") || key.startsWith("PUBLIC_"))
          .map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])
      ),
    },
  });

  if (!result.success) {
    console.error("❌ Build failed!");
    for (const log of result.logs) console.error(log);
    return false;
  }

  // Copy static assets from public folder
  const publicDir = path.resolve(process.cwd(), "public");
  if (existsSync(publicDir)) {
    cpSync(publicDir, outdir, { recursive: true });
  }

  // Inject index.css into index.html to ensure Tailwind applies
  const indexPath = path.join(outdir, "index.html");
  if (existsSync(indexPath)) {
    const file = Bun.file(indexPath);
    let html = await file.text();
    if (!html.includes('href="./index.css"')) {
      html = html.replace("</head>", `<link rel="stylesheet" href="./index.css"></head>`);
      await Bun.write(indexPath, html);
    }
  }

  const end = performance.now();
  console.log(`✅ Build completed in ${(end - start).toFixed(2)}ms`);
  return true;
};

// Initial build
await build();

if (process.argv.includes("--watch") || process.argv.includes("--dev")) {
  console.log("\n👀 Watching for changes in src/ and public/...\n");
  
  let timeout: Timer;
  const watcher = watch(path.join(process.cwd(), "src"), { recursive: true }, (event, filename) => {
    if (filename) {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        console.log(`\n🔄 Change detected in ${filename}. Rebuilding...`);
        await build();
      }, 100);
    }
  });

  process.on("SIGINT", () => {
    watcher.close();
    process.exit();
  });

  // Keep process alive
  setInterval(() => {}, 1000);
}
