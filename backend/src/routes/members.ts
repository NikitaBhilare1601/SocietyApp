import { MemberController } from "../controllers/members";

export const memberRoutes: Record<string, Record<string, (req: any, params?: any) => Response | Promise<Response>>> = {
  "/api/members": {
    GET: MemberController.getAll,
    POST: MemberController.create
  },
  "/api/members/:id": {
    PUT: MemberController.update,
    DELETE: MemberController.delete
  },
  "/api/members/:id/permissions": {
    PUT: MemberController.updatePermissions
  },
  "/api/members/bulk-create": {
    POST: MemberController.bulkCreate
  },
};
