import { ImportController } from "../controllers/import";

export const importRoutes: Record<string, Record<string, (req: any, params?: any) => Response | Promise<Response>>> = {
  "/api/import/preview": {
    POST: ImportController.preview
  },
  "/api/import": {
    POST: ImportController.importData
  }
};
