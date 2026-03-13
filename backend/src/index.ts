import { serve } from "bun";
import { existsSync } from "fs";
import path from "path";
import { config } from "../../config/env";
import { societyRoutes } from "./routes/societies";
import { memberRoutes } from "./routes/members";
import { wingRoutes } from "./routes/wings";
import { authRoutes } from "./routes/auth";
import { importRoutes } from "./routes/import";
import { logRoutes, statRoutes } from "./routes/stats_logs";
import { sequelize } from "./models";

try {
  await sequelize.authenticate();
  console.log("✅ Connection to SQLite has been established successfully via Sequelize.");
  // Sync all models (this creates tables if they don't exist, similar to the original db.run calls)
  await sequelize.sync();
  console.log("✅ Sequelize models synced.");
  
  // Seed default data
  const { seedDatabase } = await import("./models/seed");
  await seedDatabase();
} catch (error) {
  console.error("❌ Unable to connect to the database or sync models:", error);
}

console.log("authRoutes:", authRoutes);
console.log("societyRoutes:", societyRoutes);
console.log("memberRoutes:", memberRoutes);
console.log("wingRoutes:", wingRoutes);
console.log("importRoutes:", importRoutes);
console.log("logRoutes:", logRoutes);
console.log("statRoutes:", statRoutes);

const routes = {
  ...authRoutes,
  ...societyRoutes,
  ...memberRoutes,
  ...wingRoutes,
  ...importRoutes,
  ...logRoutes,
  ...statRoutes,
};

console.log("config object state:", config);

const server = Bun.serve({
  port: config.port,
  hostname: "0.0.0.0",
  development: config.nodeEnv !== "production",
  async fetch(req) {
    const url = new URL(req.url);
    console.log(`[${req.method}] ${url.pathname}`);

    // Helper to match routes with parameters
    const matchRoute = (pattern: string, pathName: string) => {
      if (pattern === pathName) return {};
      const patternParts = pattern.split("/");
      const pathParts = pathName.split("/");
      if (patternParts.length !== pathParts.length) return null;
      const params: Record<string, string> = {};
      for (let i = 0; i < patternParts.length; i++) {
        const pPart = patternParts[i];
        const phPart = pathParts[i];
        if (pPart && pPart.startsWith(":")) {
          params[pPart.substring(1)] = phPart || "";
        } else if (pPart !== phPart) {
          return null;
        }
      }
      return params;
    };

    // Iterate through defined routes
    for (const pattern in routes) {
      const params = matchRoute(pattern, url.pathname);
      if (params) {
        const routeHandler = (routes as any)[pattern][req.method];
        if (routeHandler) {
          try {
            (req as any).params = params;
            return await routeHandler(req, params);
          } catch (error: any) {
            console.error(`[ERROR] ${req.method} ${url.pathname}:`, error);
            return Response.json({
              success: false,
              message: error.message || "Internal Server Error",
              stack: process.env.NODE_ENV === "development" ? error.stack : undefined
            }, { status: 500 });
          }
        }
      }
    }

    // Serve API errors
    if (url.pathname.startsWith("/api/")) {
      return Response.json({ success: false, message: "API Endpoint Not Found" }, { status: 404 });
    }

    // Serve static uploads
    if (url.pathname.startsWith("/uploads/")) {
      const fileName = url.pathname.replace("/uploads/", "");
      const uploadPath = path.join(config.uploadsDir, fileName);
      if (existsSync(uploadPath)) {
        return new Response(Bun.file(uploadPath));
      }
    }

    // Static file serving and SPA fallback
    const distPath = path.join(process.cwd(), "..", "frontend", "dist");
    const filePath = path.join(distPath, url.pathname === "/" ? "index.html" : url.pathname);
    
    if (existsSync(filePath)) {
      return new Response(Bun.file(filePath));
    }

    // SPA Fallback for production
    const indexPath = path.join(distPath, "index.html");
    if (existsSync(indexPath)) {
      const file = Bun.file(indexPath);
      const text = await file.text();
      const timestamp = Date.now();
      // Simple cache busting for production
      const modified = text
        .replace(/src="([^"]+\.js)"/g, `src="$1?v=${timestamp}"`)
        .replace(/href="([^"]+\.css)"/g, `href="$1?v=${timestamp}"`);
      return new Response(modified, { headers: { "Content-Type": "text/html", "Cache-Control": "no-store" } });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 SocietyApp Server running at ${server.url}`);
