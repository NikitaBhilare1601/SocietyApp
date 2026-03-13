import { AuthController } from "../controllers/auth";

export const authRoutes: Record<string, Record<string, (req: any, params?: any) => Response | Promise<Response>>> = {
  "/api/login": {
    POST: AuthController.login
  },
  "/api/roles": {
    GET: AuthController.getRoles,
    POST: AuthController.createRole
  },
  "/api/roles/:id": {
    PUT: AuthController.updateRole,
    DELETE: AuthController.deleteRole
  },
  "/api/users": {
    GET: AuthController.getUsers,
    POST: AuthController.createUser
  },
  "/api/users/:id": {
    PUT: AuthController.updateUser,
    DELETE: AuthController.deleteUser
  }
};
