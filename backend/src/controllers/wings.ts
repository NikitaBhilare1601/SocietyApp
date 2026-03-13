import { Wing } from "../models";
import { createLog, getActorFromHeaders } from "../services/logger";
import { notifyWhatsApp } from "../services/whatsapp";

export const WingController = {
  async getAll(req: any) {
    const role = req.headers.get("x-user-role");
    const societyId = req.headers.get("x-society-id");

    if (role === "Super Admin") {
      const wings = await Wing.findAll();
      return Response.json(wings);
    }

    if (societyId) {
      const wings = await Wing.findAll({ where: { societyId } });
      return Response.json(wings);
    }
    
    const wings = await Wing.findAll();
    return Response.json(wings);
  },

  async create(req: any) {
    const { societyId, wingName, flats } = await req.json();

    const wing = await Wing.create({
      societyId,
      wingName,
      flats,
    });

    const actor = getActorFromHeaders(req);
    createLog({
      action: "create",
      entityType: "wing",
      entityId: wing.id,
      entityName: typeof wingName === "string" ? wingName.trim() : "",
      actorUserId: actor.actorUserId,
      actorMemberId: actor.actorMemberId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      societyId: societyId ? Number(societyId) : actor.societyId,
    });

    notifyWhatsApp("create", "wing", {
      wingName: typeof wingName === "string" ? wingName.trim() : "",
      societyId: societyId ? Number(societyId) : actor.societyId
    });

    return Response.json({ id: wing.id, societyId, wingName, flats });
  },

  async update(req: any) {
    const id = req.params.id;
    const { wingName, flats } = await req.json();
    const actor = getActorFromHeaders(req);

    const existingWing = await Wing.findByPk(id);

    if (existingWing) {
      await existingWing.update({ wingName, flats });

      createLog({
        action: "update",
        entityType: "wing",
        entityId: Number(id),
        entityName: wingName || existingWing.wingName || "",
        actorUserId: actor.actorUserId, actorMemberId: actor.actorMemberId, actorName: actor.actorName,
        actorRole: actor.actorRole, societyId: existingWing.societyId ? Number(existingWing.societyId) : actor.societyId,
      });

      notifyWhatsApp("update", "wing", {
        wingName: wingName || existingWing.wingName || "",
        societyId: existingWing.societyId ? Number(existingWing.societyId) : actor.societyId
      });
    }

    return Response.json({ success: true });
  },

  async delete(req: any) {
    const id = req.params.id;
    const actor = getActorFromHeaders(req);
    const existingWing = await Wing.findByPk(id);
    
    if (existingWing) {
      await existingWing.destroy();
      
      createLog({
        action: "delete", entityType: "wing", entityId: Number(id), entityName: existingWing.wingName || "",
        actorUserId: actor.actorUserId, actorMemberId: actor.actorMemberId, actorName: actor.actorName,
        actorRole: actor.actorRole, societyId: existingWing.societyId ? Number(existingWing.societyId) : actor.societyId,
      });

      notifyWhatsApp("delete", "wing", {
        wingName: existingWing.wingName || "",
        societyId: existingWing.societyId ? Number(existingWing.societyId) : actor.societyId
      });
    }
    
    return Response.json({ success: true });
  }
};
