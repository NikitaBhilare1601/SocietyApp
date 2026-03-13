import { LogController } from "../controllers/logs";

export const logRoutes: Record<string, Record<string, (req: any, params?: any) => Response | Promise<Response>>> = {
  "/api/logs": {
    GET: LogController.getLogs
  },
};

export const statRoutes: Record<string, Record<string, (req: any, params?: any) => Response | Promise<Response>>> = {
  "/api/stats": {
    GET: LogController.getStats
  }
};
