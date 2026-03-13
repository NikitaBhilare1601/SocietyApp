import { Op } from "sequelize";
import { User, Role, Society, Member } from "../models";
import { createLog, getActorFromHeaders } from "../services/logger";
import { notifyWhatsApp } from "../services/whatsapp";

export const AuthController = {
  async login(req: any) {
    const { email, password } = await req.json();
    
    const userObj = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username: email }],
        password
      },
      include: [
        { model: Role, as: 'role' }
      ]
    });

    if (userObj) {
      const user = userObj.toJSON() as any;
      user.roleName = user.role?.name;
      user.permissions = user.role?.permissions;
      delete user.role;
      return Response.json({ success: true, user });
    }
    
    return Response.json({ success: false, message: "Invalid credentials" }, { status: 401 });
  },

  async getRoles(req: any) {
    const roles = await Role.findAll();
    return Response.json(roles);
  },

  async createRole(req: any) {
    const { name, description, permissions, whatsappNumber, isWhatsApp } = await req.json();
    
    const role = await Role.create({
      name,
      description,
      permissions,
      whatsappNumber: whatsappNumber || null,
      isWhatsApp: isWhatsApp ? true : false
    });
    
    notifyWhatsApp("create", "role", { name });
    return Response.json({ id: role.id, success: true });
  },

  async updateRole(req: any) {
    const id = req.params.id;
    const { name, description, permissions, whatsappNumber, isWhatsApp } = await req.json();
    
    const existingRole = await Role.findByPk(id);
    if (existingRole) {
      await existingRole.update({
        name,
        description,
        permissions,
        whatsappNumber: whatsappNumber || null,
        isWhatsApp: isWhatsApp ? true : false
      });

      if (whatsappNumber) {
        await User.update(
          { mobileNumber: whatsappNumber },
          { where: { roleId: id } }
        );
      }
      notifyWhatsApp("update", "role", { name });
    }
    return Response.json({ success: true });
  },

  async deleteRole(req: any) {
    const id = req.params.id;
    const actor = getActorFromHeaders(req);
    
    const existingRole = await Role.findByPk(id);
    
    if (existingRole) {
      await existingRole.destroy();
      
      createLog({
        action: "delete", entityType: "role", entityId: Number(id), entityName: existingRole.name || "",
        actorUserId: actor.actorUserId, actorMemberId: actor.actorMemberId, actorName: actor.actorName,
        actorRole: actor.actorRole, societyId: actor.societyId,
      });
      notifyWhatsApp("delete", "role", { name: existingRole.name || "" });
    }
    return Response.json({ success: true });
  },

  async getUsers(req: any) {
    const role = req.headers.get("x-user-role");
    const societyId = req.headers.get("x-society-id");
    
    const whereClause: any = {};
    if (role === "Society Admin" && societyId) {
      whereClause.societyId = societyId;
    }

    const users = await User.findAll({
      where: whereClause,
      include: [
        { model: Role, as: 'role', attributes: ['name'] },
        { model: Society, as: 'society', attributes: ['name'] },
        { model: Member, as: 'member', attributes: ['name'] }
      ],
      order: [['id', 'DESC']]
    });

    const formattedUsers = users.map(u => {
      const user = u.toJSON() as any;
      user.roleName = user.role?.name;
      user.societyName = user.society?.name;
      user.memberName = user.member?.name;
      delete user.role;
      delete user.society;
      delete user.member;
      return user;
    });

    return Response.json(formattedUsers);
  },

  async createUser(req: any) {
    try {
      const { fullName, email, password, roleId, status, societyId, memberId, mobileNumber } = await req.json();
      
      const user = await User.create({
        fullName,
        email,
        username: email,
        password,
        roleId,
        status,
        societyId: societyId || null,
        memberId: memberId || null,
        mobileNumber: mobileNumber || null
      });

      const actor = getActorFromHeaders(req);
      createLog({
        action: "create", entityType: "user", entityId: user.id, entityName: fullName || email,
        actorUserId: actor.actorUserId, actorMemberId: actor.actorMemberId, actorName: actor.actorName,
        actorRole: actor.actorRole, societyId: societyId ? Number(societyId) : actor.societyId,
      });
      notifyWhatsApp("create", "user", { fullName: fullName || email, email, societyId: societyId ? Number(societyId) : actor.societyId });
      
      return Response.json({ id: user.id, success: true });
    } catch (e: any) {
      return Response.json({ success: false, message: e.name === 'SequelizeUniqueConstraintError' ? "Email already exists" : "Failed to create user" }, { status: 400 });
    }
  },

  async updateUser(req: any) {
    try {
      const id = req.params.id;
      const { fullName, email, roleId, status, societyId, memberId, password, mobileNumber } = await req.json();
      
      const existingUser = await User.findByPk(id);
      if (!existingUser) return Response.json({ success: false, message: "User not found" }, { status: 404 });

      const updateData: any = {
        fullName,
        email,
        username: email,
        roleId,
        status,
        societyId: societyId || null,
        memberId: memberId || null,
        mobileNumber: mobileNumber || null
      };

      if (password) {
        updateData.password = password;
      }

      await existingUser.update(updateData);

      const actor = getActorFromHeaders(req);
      createLog({
        action: "update", entityType: "user", entityId: Number(id), entityName: fullName || email,
        actorUserId: actor.actorUserId, actorMemberId: actor.actorMemberId, actorName: actor.actorName,
        actorRole: actor.actorRole, societyId: societyId ? Number(societyId) : actor.societyId,
      });
      notifyWhatsApp("update", "user", { fullName: fullName || email, societyId: societyId ? Number(societyId) : actor.societyId });
      
      return Response.json({ success: true });
    } catch (e: any) {
      return Response.json({ success: false, message: e.name === 'SequelizeUniqueConstraintError' ? "Email already exists" : "Failed to update user" }, { status: 400 });
    }
  },

  async deleteUser(req: any) {
    const id = req.params.id;
    const actor = getActorFromHeaders(req);
    
    const existingUser = await User.findByPk(id);
    
    if (existingUser) {
      await existingUser.destroy();

      createLog({
        action: "delete", entityType: "user", entityId: Number(id), entityName: existingUser.fullName || existingUser.email || "",
        actorUserId: actor.actorUserId, actorMemberId: actor.actorMemberId, actorName: actor.actorName,
        actorRole: actor.actorRole, societyId: existingUser.societyId ? Number(existingUser.societyId) : actor.societyId,
      });
      notifyWhatsApp("delete", "user", { fullName: existingUser.fullName || existingUser.email, societyId: existingUser.societyId ? Number(existingUser.societyId) : actor.societyId });
    }
    return Response.json({ success: true });
  }
};
