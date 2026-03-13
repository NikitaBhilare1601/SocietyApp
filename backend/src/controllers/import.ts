import * as XLSX from "xlsx";
import { Society, Wing, Member } from "../models";
import { createLog, getActorFromHeaders } from "../services/logger";
import { notifyWhatsApp } from "../services/whatsapp";

const getVal = (row: Record<string, any>, keys: string[]): string => {
  for (const k of keys) {
    const v = row[k] ?? row[k.toLowerCase()] ?? row[k.toUpperCase()];
    if (v === null || v === undefined) continue;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed.length > 0) return trimmed;
      continue;
    }
    if (typeof v === "number") return String(v);
    const asString = String(v).trim();
    if (asString.length > 0) return asString;
  }
  return "";
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'; i++;
        } else { inQuotes = false; }
      } else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current); current = ""; }
      else { current += ch; }
    }
  }
  result.push(current);
  return result;
};

export const ImportController = {
  async preview(req: any) {
    const contentType = req.headers.get("content-type") || "";
    let importRows: any[] = [];
    let uploadFilename = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      for (const [, value] of formData.entries()) {
        if (value instanceof File) {
          uploadFilename = value.name;
          const ext = uploadFilename.split(".").pop()?.toLowerCase();
          if (ext === "csv") {
            const text = await value.text();
            const rows = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            const headers = parseCsvLine(rows.shift() || "");
            importRows = rows.map(line => {
              const cols = parseCsvLine(line);
              const row: any = {};
              (headers as any).forEach((h: string, i: number) => row[h.trim()] = (cols[i] || "").trim());
              return row;
            });
          } else if (ext === "xlsx") {
            const buf = await value.arrayBuffer();
            const wb = XLSX.read(buf, { type: "array" });
            const sheetName = wb.SheetNames[0];
            if (sheetName) {
              importRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]!, { defval: "" });
            }
          }
          break;
        }
      }
    }

    if (importRows.length === 0) return Response.json({ success: false, message: "No data found" }, { status: 400 });

    const membersInput = importRows.map(r => ({
      societyName: getVal(r, ["Society", "Society Name", "society"]),
      wingName: getVal(r, ["Wing", "wing", "Wing Name"]),
      flatNumber: getVal(r, ["Flat", "Flat Number", "flatNumber", "flat"]),
      name: getVal(r, ["Member Name", "Name", "name"]),
      memberType: getVal(r, ["Type", "Member Type", "memberType"]) || "Owner",
      ownerName: getVal(r, ["Owner Name", "Owner", "ownerName"]),
      gender: getVal(r, ["Gender", "gender"]),
      mobileNumber: getVal(r, ["Mobile", "Mobile Number", "mobileNumber", "Phone"]),
      email: getVal(r, ["Email", "email", "E-mail"]),
      vehicleType: getVal(r, ["Vehicle Type", "vehicleType"]),
      vehicleNumber: getVal(r, ["Vehicle Number", "vehicleNumber"]),
      status: "Pending"
    }));

    const wingFlatMap = new Map<string, Set<string>>();
    membersInput.forEach(m => {
      const key = `${m.societyName}||${m.wingName}`;
      if (!wingFlatMap.has(key)) wingFlatMap.set(key, new Set());
      if (m.flatNumber) wingFlatMap.get(key)!.add(m.flatNumber);
    });

    const wingsInput = Array.from(wingFlatMap.entries()).map(([key, flats]) => ({
      societyName: key.split("||")[0],
      wingName: key.split("||")[1],
      flats: Array.from(flats)
    }));

    const societiesInput = Array.from(new Set(membersInput.map(m => m.societyName).filter(Boolean))).map(name => ({ name }));

    return Response.json({
      success: true,
      preview: { societies: societiesInput, wings: wingsInput, members: membersInput },
      counts: { societies: societiesInput.length, wings: wingsInput.length, members: membersInput.length },
      filename: uploadFilename
    });
  },

  async importData(req: any) {
    const role = req.headers.get("x-user-role");
    const societyIdHeader = req.headers.get("x-society-id");
    const actor = getActorFromHeaders(req);
    const { societies: societiesInput, wings: wingsInput, members: membersInput } = await req.json();

    let importedSocieties = 0, importedWings = 0, importedMembers = 0;

    const getOrCreateSocietyId = async (name: string) => {
      let society = await Society.findOne({ where: { name } });
      if (society) return society.id;
      
      society = await Society.create({ name, numberOfWings: 0, isWhatsApp: false });
      importedSocieties++;
      createLog({
        action: "create", entityType: "society", entityId: society.id, entityName: name,
        actorUserId: actor.actorUserId, actorMemberId: actor.actorMemberId, actorName: actor.actorName,
        actorRole: actor.actorRole, societyId: society.id
      });
      return society.id;
    };

    if (role === "Super Admin" && societiesInput) {
      for (const s of societiesInput) {
        await getOrCreateSocietyId(s.name);
      }
    }

    if (wingsInput) {
      for (const w of wingsInput) {
        const targetSocId = (role === "Society Admin" && societyIdHeader) ? Number(societyIdHeader) : await getOrCreateSocietyId(w.societyName);
        
        const existingWing = await Wing.findOne({ where: { societyId: targetSocId, wingName: w.wingName } });
        
        if (existingWing) {
          const mergedFlats = Array.from(new Set([...existingWing.flats.split(",").map((f:any)=>f.trim()), ...w.flats])).join(", ");
          await existingWing.update({ flats: mergedFlats });
        } else {
          const newWing = await Wing.create({ societyId: targetSocId, wingName: w.wingName, flats: w.flats.join(", ") });
          importedWings++;
          createLog({
            action: "create", entityType: "wing", entityId: newWing.id, entityName: w.wingName,
            actorUserId: actor.actorUserId, actorMemberId: actor.actorMemberId, actorName: actor.actorName,
            actorRole: actor.actorRole, societyId: targetSocId
          });
        }
      }
    }

    if (membersInput) {
      for (const m of membersInput) {
        const targetSocId = (role === "Society Admin" && societyIdHeader) ? Number(societyIdHeader) : await getOrCreateSocietyId(m.societyName);
        const societyRow = await Society.findByPk(targetSocId);
        const targetSocName = societyRow?.name || m.societyName;

        const newMember = await Member.create({
          name: m.name,
          societyId: targetSocId,
          societyName: targetSocName,
          wingName: m.wingName,
          flatNumber: m.flatNumber,
          memberType: m.memberType,
          ownerName: m.ownerName || null,
          gender: m.gender,
          mobileNumber: m.mobileNumber,
          email: m.email || null,
          vehicleType: m.vehicleType || null,
          vehicleNumber: m.vehicleNumber || null,
          status: 'Pending',
          roleType: 'Society Member',
          canRead: true,
          canEdit: false,
          canDelete: false
        });
        
        importedMembers++;
        createLog({
          action: "create", entityType: "member", entityId: newMember.id, entityName: m.name,
          actorUserId: actor.actorUserId, actorMemberId: actor.actorMemberId, actorName: actor.actorName,
          actorRole: actor.actorRole, societyId: targetSocId
        });
      }
    }

    if (importedSocieties > 0) notifyWhatsApp("import", "society", { count: importedSocieties });
    if (importedWings > 0) notifyWhatsApp("import", "wing", { count: importedWings, societyId: Number(societyIdHeader) });
    if (importedMembers > 0) notifyWhatsApp("import", "member", { count: importedMembers, societyId: Number(societyIdHeader) });

    return Response.json({ success: true, counts: { societies: importedSocieties, wings: importedWings, members: importedMembers } });
  }
};
