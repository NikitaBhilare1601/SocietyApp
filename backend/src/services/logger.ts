import { Log } from "../models";

export const getActorFromHeaders = (req: Request) => {
  const actorUserIdHeader = req.headers.get("x-user-id");
  const actorMemberIdHeader = req.headers.get("x-member-id");
  const societyIdHeader = req.headers.get("x-society-id");
  return {
    actorUserId: actorUserIdHeader ? Number(actorUserIdHeader) : null,
    actorMemberId: actorMemberIdHeader ? Number(actorMemberIdHeader) : null,
    actorName: req.headers.get("x-user-name") || "",
    actorRole: req.headers.get("x-user-role") || "",
    societyId: societyIdHeader ? Number(societyIdHeader) : null,
  };
};

export const createLog = async (params: {
  action: string;
  entityType: string;
  entityId: number | null;
  entityName: string;
  actorUserId: number | null;
  actorMemberId: number | null;
  actorName: string;
  actorRole: string;
  societyId: number | null;
}) => {
  try {
    await Log.create({
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      actorUserId: params.actorUserId,
      actorMemberId: params.actorMemberId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      societyId: params.societyId,
    });
  } catch (error) {
    console.error("Failed to create log:", error);
  }
};
