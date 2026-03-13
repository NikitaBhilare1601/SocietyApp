import { SocietyController } from "../controllers/societies";

export const societyRoutes: Record<string, Record<string, (req: any, params?: any) => Response | Promise<Response>>> = {
  "/api/societies": {
    GET: SocietyController.getAll,
    POST: SocietyController.create
  },
  "/api/societies/:id": {
    PUT: SocietyController.update,
    DELETE: SocietyController.delete
  }
};
