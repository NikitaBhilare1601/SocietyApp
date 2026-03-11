import jwt from 'jsonwebtoken';
import { users, roles, roleMenuMappings, menus } from '../db/schema';
import { eq } from 'drizzle-orm';

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authorizeRole = (requiredRole) => {
  return async (req, res, next) => {
    const userRole = await roles.findFirst({
      where: eq(roles.id, req.user.roleId),
    });

    if (!userRole || userRole.name !== requiredRole) {
      return res.sendStatus(403);
    }

    next();
  };
};

const authorizeMenuAccess = (menuName) => {
  return async (req, res, next) => {
    const userMenus = await roleMenuMappings.findMany({
      where: eq(roleMenuMappings.roleId, req.user.roleId),
      include: { menu: true },
    });

    const hasAccess = userMenus.some((menu) => menu.name === menuName);

    if (!hasAccess) {
      return res.sendStatus(403);
    }

    next();
  };
};

export { authenticateToken, authorizeRole, authorizeMenuAccess };