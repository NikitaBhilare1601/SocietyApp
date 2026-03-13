import { Society, Member, User, Role } from "../models";
import { createLog, getActorFromHeaders } from "../services/logger";
import { notifyWhatsApp } from "../services/whatsapp";

export const SocietyController = {
  async getAll(req: any) {
    const role = req.headers.get("x-user-role");
    const societyId = req.headers.get("x-society-id");

    if ((role === "Society Admin" || role === "Member") && societyId) {
      const society = await Society.findByPk(societyId);
      return Response.json(society ? [society] : []);
    }
    const societies = await Society.findAll({ order: [['id', 'ASC']] });
    return Response.json(societies);
  },

  async create(req: any) {
    const body = await req.json();
    const { name, numberOfWings, whatsappNumber, isWhatsApp } = body;

    const society = await Society.create({
      name,
      numberOfWings,
      whatsappNumber: whatsappNumber || null,
      isWhatsApp: isWhatsApp ? true : false,
    });

    const actor = getActorFromHeaders(req);
    createLog({
      action: "create",
      entityType: "society",
      entityId: society.id,
      entityName: typeof name === "string" ? name.trim() : "",
      actorUserId: actor.actorUserId,
      actorMemberId: actor.actorMemberId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      societyId: society.id,
    });

    notifyWhatsApp("create", "society", { name, id: society.id });

    return Response.json({ id: society.id, name, numberOfWings });
  },

  async update(req: any) {
    const id = req.params.id;
    const body = await req.json();
    const { name, numberOfWings, whatsappNumber, isWhatsApp } = body;
    const actor = getActorFromHeaders(req);

    const existingSociety = await Society.findByPk(id);

    if (existingSociety) {
      await existingSociety.update({
        name,
        numberOfWings,
        whatsappNumber: whatsappNumber || null,
        isWhatsApp: isWhatsApp ? true : false,
      });

      if (whatsappNumber) {
        const adminRole = await Role.findOne({ where: { name: 'Society Admin' } });
        if (adminRole) {
          await User.update(
            { mobileNumber: whatsappNumber },
            { where: { societyId: id, roleId: adminRole.id } }
          );
        }
      }

      createLog({
        action: "update",
        entityType: "society",
        entityId: Number(id),
        entityName: name || existingSociety.name || "",
        actorUserId: actor.actorUserId,
        actorMemberId: actor.actorMemberId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        societyId: Number(id),
      });

      notifyWhatsApp("update", "society", { name: name || existingSociety.name || "", id: Number(id) });
    }

    return Response.json({ success: true });
  },

  async delete(req: any) {
    const id = req.params.id;
    const actor = getActorFromHeaders(req);
    const existingSociety = await Society.findByPk(id);
    
    if (existingSociety) {
      await Member.destroy({ where: { societyId: id } });
      await existingSociety.destroy();
      
      createLog({
        action: "delete",
        entityType: "society",
        entityId: Number(id),
        entityName: existingSociety.name || "",
        actorUserId: actor.actorUserId,
        actorMemberId: actor.actorMemberId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        societyId: Number(id),
      });

      notifyWhatsApp("delete", "society", { name: existingSociety.name || "", id: Number(id) });
    }

    return Response.json({ success: true });
  }
};
