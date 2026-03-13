import { WingController } from "../controllers/wings";

export const wingRoutes: Record<string, Record<string, (req: any, params?: any) => Response | Promise<Response>>> = {
  "/api/wings": {
    GET: WingController.getAll,
    POST: WingController.create
  },
  "/api/wings/:id": {
    PUT: WingController.update,
    DELETE: WingController.delete
  },
};
