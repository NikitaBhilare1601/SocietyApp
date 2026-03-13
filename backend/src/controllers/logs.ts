import { Op } from "sequelize";
import { Log, Society, Member, Wing } from "../models";

export const LogController = {
  async getLogs(req: any) {
    const role = req.headers.get("x-user-role");
    const societyId = req.headers.get("x-society-id");
    const memberId = req.headers.get("x-member-id");

    const whereClause: any = {};

    if (role !== "Super Admin" && role !== "admin") {
      if (role === "Society Admin" && societyId) {
        whereClause.societyId = societyId;
      } else if (role === "Member" && memberId) {
        whereClause[Op.or] = [
          { actorMemberId: memberId },
          { entityType: 'member', entityId: memberId }
        ];
      } else {
        // Return nothing if unauthorized
        return Response.json([]);
      }
    }

    const logs = await Log.findAll({
      where: whereClause,
      order: [['id', 'DESC']]
    });

    return Response.json(logs);
  },

  async getStats(req: any) {
    const role = req.headers.get("x-user-role");
    const societyId = req.headers.get("x-society-id");

    let societiesCount = 0;
    let membersCount = 0;
    let activeWings = 0;
    let totalFlats = 0;
    let recentMembers: any[] = [];

    if (role === "Super Admin" || role === "admin") {
      societiesCount = await Society.count();
      membersCount = await Member.count();
      activeWings = await Wing.count();
      totalFlats = membersCount;
      recentMembers = await Member.findAll({
        order: [['id', 'DESC']],
        limit: 5
      });
    } else if ((role === "Society Admin" || role === "Member") && societyId) {
      societiesCount = 1;
      membersCount = await Member.count({ where: { societyId } });
      activeWings = await Wing.count({ where: { societyId } });
      totalFlats = membersCount;
      recentMembers = await Member.findAll({
        where: { societyId },
        order: [['id', 'DESC']],
        limit: 5
      });
    }

    return Response.json({ societiesCount, membersCount, activeWings, totalFlats, recentMembers });
  }
};
