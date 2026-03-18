import { Member, Society } from "../models";
import { createLog, getActorFromHeaders } from "../services/logger";
import { notifyWhatsApp } from "../services/whatsapp";
import { config } from "../../../config/env";
import path from "path";

export const MemberController = {
  async getAll(req: any) {
    const role = req.headers.get("x-user-role");
    const societyId = req.headers.get("x-society-id");
    const memberId = req.headers.get("x-member-id");

    if (role === "Society Admin" && societyId) {
      const members = await Member.findAll({
        where: { societyId },
        order: [['id', 'DESC']]
      });
      return Response.json(members);
    }
    if (role === "Member" && memberId) {
      const member = await Member.findByPk(memberId);
      if (!member || !member.canRead) {
        return Response.json({ success: false, message: "Access denied" }, { status: 403 });
      }
      return Response.json([member]);
    }

    const members = await Member.findAll({ order: [['id', 'DESC']] });
    return Response.json(members);
  },

  async create(req: any) {
    try {
      let body: any = {};
      let documents = "";
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        for (const [key, value] of formData.entries()) {
          if (value instanceof File && value.size > 0) {
            const fileName = `${Date.now()}-${value.name}`;
            await Bun.write(path.join(config.uploadsDir, fileName), value);
            documents = `/uploads/${fileName}`;
          } else if (typeof value === "string") {
            body[key] = value;
          }
        }
      } else {
        body = await req.json();
      }

      console.log("[MemberController] Creating member with body:", body);

      const {
        name, societyId, societyName, wingName, flatNumber,
        memberType, ownerName, gender, mobileNumber, email,
        vehicleType, vehicleNumber, roleType
      } = body;

      const member = await Member.create({
        name: typeof name === "string" ? name.trim() : "",
        societyId: Number(societyId),
        societyName: typeof societyName === "string" ? societyName.trim() : "",
        wingName: typeof wingName === "string" ? wingName.trim() : "",
        flatNumber: typeof flatNumber === "string" ? flatNumber.trim() : "",
        memberType: typeof memberType === "string" ? memberType.trim() : "Owner",
        ownerName: ownerName || null,
        gender: typeof gender === "string" ? gender.trim() : "",
        mobileNumber: typeof mobileNumber === "string" ? mobileNumber.trim() : "",
        email: typeof email === "string" ? email.trim() : null,
        vehicleType: vehicleType || null,
        vehicleNumber: vehicleNumber || null,
        documents: documents || null,
        roleType: typeof roleType === "string" ? roleType.trim() : "Society Member",
        status: 'Pending',
        canRead: true,
        canEdit: false,
        canDelete: false
      });

      console.log("[MemberController] Member created successfully:", member.id);

      const actor = getActorFromHeaders(req);
      createLog({
        action: "create",
        entityType: "member",
        entityId: member.id,
        entityName: member.name,
        actorUserId: actor.actorUserId,
        actorMemberId: actor.actorMemberId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        societyId: societyId ? Number(societyId) : actor.societyId,
      });

      notifyWhatsApp("create", "member", {
        name, mobileNumber, societyName,
        societyId: societyId ? Number(societyId) : actor.societyId
      });

      return Response.json({ id: member.id, ...body, status: 'Pending', documents });
    } catch (error: any) {
      console.error("[MemberController] Create failed:", error);
      return Response.json({ success: false, message: error.message || "Failed to create member" }, { status: 500 });
    }
  },

  async update(req: any) {
    try {
      const id = req.params.id;
      const role = req.headers.get("x-user-role");
      const userMemberId = req.headers.get("x-member-id");
      const actor = getActorFromHeaders(req);

      const existingMember = await Member.findByPk(id);
      if (!existingMember) {
        return Response.json({ success: false, message: "Member not found" }, { status: 404 });
      }

      if (role === "Member" && (id !== userMemberId || !existingMember.canEdit)) {
        return Response.json({ success: false, message: "Unauthorized or access denied" }, { status: 403 });
      }

      let body: any;
      let newDocument = null;
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        body = {};
        for (const [key, value] of formData.entries()) {
          if (value instanceof File && value.size > 0) {
            const fileName = `${Date.now()}-${value.name}`;
            await Bun.write(path.join(config.uploadsDir, fileName), value);
            newDocument = `/uploads/${fileName}`;
          } else if (typeof value === "string") {
            body[key] = value;
          }
        }
      } else {
        body = await req.json();
      }

      const {
        name, societyId, societyName, wingName, flatNumber,
        memberType, ownerName, gender, mobileNumber, email,
        vehicleType, vehicleNumber, status, roleType
      } = body;

      let currentStatus = existingMember.status;
      let currentDocuments = existingMember.documents || "";

      if (status && status !== currentStatus && (role === "Society Admin" || role === "Super Admin")) {
        currentStatus = status;
      }

      if (newDocument) {
        currentDocuments = newDocument;
        if (role === "Member") currentStatus = "Pending";
      }

      if (!currentDocuments && memberType !== "System User") {
        return Response.json({ success: false, message: "Document upload required for update" }, { status: 400 });
      }

      const nextRoleType = roleType || existingMember.roleType || 'Society Member';
      let nextCanRead = existingMember.canRead, nextCanEdit = existingMember.canEdit, nextCanDelete = existingMember.canDelete;

      if (nextRoleType === "System User") {
        nextCanRead = true; nextCanEdit = false; nextCanDelete = false;
      }

      await existingMember.update({
        name: name || existingMember.name,
        societyId: societyId || existingMember.societyId,
        societyName: societyName || existingMember.societyName,
        wingName: wingName || existingMember.wingName,
        flatNumber: flatNumber || existingMember.flatNumber,
        memberType: memberType || existingMember.memberType,
        ownerName: ownerName || existingMember.ownerName,
        gender: gender || existingMember.gender,
        mobileNumber: mobileNumber || existingMember.mobileNumber,
        email: email || existingMember.email,
        vehicleType: vehicleType || existingMember.vehicleType,
        vehicleNumber: vehicleNumber || existingMember.vehicleNumber,
        status: currentStatus,
        documents: currentDocuments,
        roleType: nextRoleType,
        canRead: nextCanRead,
        canEdit: nextCanEdit,
        canDelete: nextCanDelete
      });

      const approved = (existingMember.status !== currentStatus && currentStatus === "Active") || (body.status === "Active");
      if (approved) {
        createLog({
          action: "document_approve", entityType: "member", entityId: Number(id), entityName: existingMember.name || "",
          actorUserId: actor.actorUserId, actorMemberId: actor.actorMemberId, actorName: actor.actorName,
          actorRole: actor.actorRole, societyId: existingMember.societyId ? Number(existingMember.societyId) : actor.societyId,
        });
        notifyWhatsApp("approve", "member", { name: existingMember.name, societyName: existingMember.societyName, societyId: existingMember.societyId });
      }
      
      createLog({
        action: "update", entityType: "member", entityId: Number(id), entityName: existingMember.name || "",
        actorUserId: actor.actorUserId, actorMemberId: actor.actorMemberId, actorName: actor.actorName,
        actorRole: actor.actorRole, societyId: existingMember.societyId ? Number(existingMember.societyId) : actor.societyId,
      });

      notifyWhatsApp("update", "member", { name: name || existingMember.name, societyId: societyId || existingMember.societyId, societyName: societyName || existingMember.societyName });

      return Response.json({ success: true, status: currentStatus, documents: currentDocuments });
    } catch (error: any) {
      console.error("[MemberController] Update failed:", error);
      return Response.json({ success: false, message: error.message || "Failed to update member" }, { status: 500 });
    }
  },

  async delete(req: any) {
    try {
      const id = req.params.id;
      const role = req.headers.get("x-user-role");
      const userMemberId = req.headers.get("x-member-id");
      const actor = getActorFromHeaders(req);

      const existingMember = await Member.findByPk(id);
      if (!existingMember) return Response.json({ success: false, message: "Member not found" }, { status: 404 });

      if (role === "Member" && (id !== userMemberId || !existingMember.canDelete)) {
        return Response.json({ success: false, message: "Unauthorized or access denied" }, { status: 403 });
      }

      await existingMember.destroy();
      
      createLog({
        action: "delete", entityType: "member", entityId: Number(id), entityName: existingMember.name || "",
        actorUserId: actor.actorUserId, actorMemberId: actor.actorMemberId, actorName: actor.actorName,
        actorRole: actor.actorRole, societyId: existingMember.societyId ? Number(existingMember.societyId) : actor.societyId,
      });
      notifyWhatsApp("delete", "member", { name: existingMember.name, societyName: existingMember.societyName, societyId: existingMember.societyId });
      
      return Response.json({ success: true });
    } catch (error: any) {
      console.error("[MemberController] Delete failed:", error);
      return Response.json({ success: false, message: error.message || "Failed to delete member" }, { status: 500 });
    }
  },

  async updatePermissions(req: any) {
    try {
      const id = req.params.id;
      const role = req.headers.get("x-user-role");
      const societyId = req.headers.get("x-society-id");

      if (role !== "Society Admin" && role !== "Super Admin") return Response.json({ success: false, message: "Unauthorized" }, { status: 403 });

      const existingMember = await Member.findByPk(id);
      if (!existingMember) return Response.json({ success: false, message: "Member not found" }, { status: 404 });
      if (role === "Society Admin" && societyId && Number(existingMember.societyId) !== Number(societyId)) return Response.json({ success: false, message: "Unauthorized" }, { status: 403 });

      const { canRead, canEdit, canDelete } = await req.json();
      if (existingMember.roleType === "System User" && (canEdit || canDelete)) return Response.json({ success: false, message: "System Users can only have view permission" }, { status: 400 });

      const nextCanRead = !!canRead, nextCanEdit = !!canEdit, nextCanDelete = !!canDelete;
      await existingMember.update({ canRead: nextCanRead, canEdit: nextCanEdit, canDelete: nextCanDelete });

      return Response.json({ success: true, canRead: nextCanRead, canEdit: nextCanEdit, canDelete: nextCanDelete });
    } catch (error: any) {
      console.error("[MemberController] Update permissions failed:", error);
      return Response.json({ success: false, message: error.message || "Failed to update permissions" }, { status: 500 });
    }
  },

  async bulkCreate(req: any) {
    try {
      const actor = getActorFromHeaders(req);
      const { actorRole: role, societyId } = actor;

      console.log("[MemberController] bulkCreate started. Actor:", actor);

      if (role !== "Society Admin" && role !== "Super Admin") {
        return Response.json({ success: false, message: "Unauthorized" }, { status: 403 });
      }

      const membersToCreate = await req.json();
      console.log(`[MemberController] Received ${membersToCreate?.length} members to import.`);

      if (!Array.isArray(membersToCreate)) {
        return Response.json({ success: false, message: "Request body must be an array" }, { status: 400 });
      }

      let successfulImports = 0;
      let failedImports = 0;
      const errors: string[] = [];

      for (let i = 0; i < membersToCreate.length; i++) {
        const member = membersToCreate[i];
        try {
          let memberSocietyId = role === "Society Admin" ? societyId : member.societyId;
          
          // Fallback: If no societyId, try to find by name
          if (!memberSocietyId && member.societyName) {
            console.log(`[MemberController] Society ID missing for row ${i+1}. Attempting to resolve by name: "${member.societyName}"`);
            const foundSoc = await Society.findOne({ 
              where: { name: String(member.societyName).trim() } 
            });
            if (foundSoc) {
              memberSocietyId = foundSoc.id;
              console.log(`[MemberController] Resolved to Society ID: ${memberSocietyId}`);
            } else {
              // Last ditch: if there's only one society in the system, use it
              const allSocieties = await Society.findAll();
              if (allSocieties.length === 1) {
                memberSocietyId = allSocieties[0]!.id;
                console.log(`[MemberController] No name match found, but system only has one society. Defaulting to: ${allSocieties[0]!.name} (${memberSocietyId})`);
              }
            }
          }

          if (!member.name || String(member.name).trim() === "") {
            console.warn(`[MemberController] Member at index ${i} skipped: name missing.`);
            errors.push(`Row ${i + 1}: Member Name is missing.`);
            failedImports++;
            continue;
          }

          if (!memberSocietyId) {
            console.warn(`[MemberController] Member at index ${i} skipped: could not resolve societyId.`);
            errors.push(`Row ${i + 1}: Could not determine Society for "${member.name}". Please ensure Society Name is correct in Excel.`);
            failedImports++;
            continue;
          }

          console.log(`[MemberController] Importing member: ${member.name} for societyId: ${memberSocietyId}`);

          const newMember = await Member.create({
            name: String(member.name || "").trim(),
            societyId: Number(memberSocietyId),
            societyName: String(member.societyName || "").trim(),
            wingName: String(member.wingName || "").trim(),
            flatNumber: String(member.flatNumber || "").trim(),
            memberType: member.memberType || "Owner",
            ownerName: member.memberType?.toLowerCase() === "tenant" ? (member.ownerName || null) : null,
            gender: String(member.gender || "Male").trim(),
            mobileNumber: String(member.mobileNumber || "").trim(),
            email: member.email || null,
            vehicleType: member.vehicleType || null,
            vehicleNumber: member.vehicleNumber || null,
            status: 'Pending',
            documents: member.documents || null,
            roleType: member.roleType || "Society Member",
            canRead: true,
            canEdit: false,
            canDelete: false
          });

          createLog({
            action: "import", 
            entityType: "member", 
            entityId: newMember.id, 
            entityName: member.name || "",
            actorUserId: actor.actorUserId, 
            actorMemberId: actor.actorMemberId, 
            actorName: actor.actorName,
            actorRole: actor.actorRole, 
            societyId: Number(memberSocietyId),
          });

          notifyWhatsApp("create", "member", { 
            name: member.name || "", 
            mobileNumber: member.mobileNumber || "", 
            societyName: member.societyName || "", 
            societyId: Number(memberSocietyId) 
          });
          
          successfulImports++;
        } catch (e: any) {
          console.error(`[MemberController] Import failed for row ${i + 1} (${member.name}):`, e.message);
          errors.push(`Row ${i + 1} (${member.name || 'Unnamed'}): ${e.message}`);
          failedImports++;
        }
      }

      console.log(`[MemberController] Import complete. Success: ${successfulImports}, Failed: ${failedImports}`);

      return Response.json({ 
        success: true, 
        message: `Import completed. ${successfulImports} saved, ${failedImports} failed.`,
        successful: successfulImports,
        failed: failedImports,
        errors: errors
      });
    } catch (error: any) {
      console.error("[MemberController] Critical bulk create failure:", error);
      return Response.json({ success: false, message: error.message || "Failed to import members" }, { status: 500 });
    }
  }

};
