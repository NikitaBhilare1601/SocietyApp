import { serve } from "bun";
import { existsSync } from "fs";
import * as XLSX from "xlsx";
import db from "./db";

const getActorFromHeaders = (req: Request) => {
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

const createLog = (params: {
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
  const insert = db.prepare(`
    INSERT INTO logs (
      action, entityType, entityId, entityName,
      actorUserId, actorMemberId, actorName, actorRole, societyId, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run(
    params.action,
    params.entityType,
    params.entityId,
    params.entityName,
    params.actorUserId,
    params.actorMemberId,
    params.actorName,
    params.actorRole,
    params.societyId,
    new Date().toISOString()
  );
};

/**
 * 🔹 WHATSAPP NOTIFICATION HELPER 🔹
 * This function handles role-based notifications:
 * - Sends notification to Super Admin and Society Admin for ADD, EDIT, DELETE operations.
 */
const notifyWhatsApp = async (
  action: "create" | "update" | "delete" | "add" | "edit" | "approve" | "import",
  entityType: "member" | "society" | "wing" | "role" | "user",
  data: any
) => {
  console.log("!!! VERSION 2.1 - RELAY LOGGING !!!");
  console.log(`🚀 [WhatsApp Trigger] Action: ${action}, Entity: ${entityType}`, data);
  try {
    // Normalize action for message
    const actionMap: Record<string, string> = {
      "create": "Created",
      "add": "Created",
      "update": "Updated",
      "edit": "Updated",
      "delete": "Deleted",
      "approve": "Approved",
      "import": "Imported"
    };
    const actionText = actionMap[action] || action.toUpperCase();

    let message = "";
    let societyId: number | null = null;

    // Construct Message based on Entity Type
    switch (entityType) {
      case "member":
        if (action === "create" || action === "add") {
          message = `*New Member Added*: *${data.name}* has been registered in *${data.societyName || 'your society'}*.`;
        } else if (action === "update" || action === "edit") {
          message = `*Profile Updated*: Member *${data.name}* has updated their profile details.`;
        } else if (action === "delete") {
          message = `*Member Removed*: *${data.name}* has been removed from the society records.`;
        } else if (action === "approve") {
          message = `*Member Approved*: *${data.name}* has been approved and is now active in *${data.societyName || 'the society'}*.`;
        } else if (action === "import") {
          message = `*Bulk Import*: *${data.count || 1}* members have been imported into *${data.societyName || 'the society'}*.`;
        }
        societyId = data.societyId;
        break;
      case "society":
        if (action === "create" || action === "add") {
          message = `*New Society Registered*: *${data.name}* has been added to the system.`;
        } else if (action === "update" || action === "edit") {
          message = `*Society Updated*: Details for *${data.name}* have been modified.`;
        } else if (action === "delete") {
          message = `*Society Removed*: *${data.name}* has been deleted from the system.`;
        } else if (action === "import") {
          message = `*Bulk Import*: *${data.count || 1}* societies have been added to the system.`;
        }
        societyId = data.id;
        break;
      case "wing":
        if (action === "create" || action === "add") {
          message = `*New Wing Added*: Wing *${data.wingName}* has been added.`;
        } else if (action === "update" || action === "edit") {
          message = `*Wing Updated*: Wing *${data.wingName}* has been modified.`;
        } else if (action === "delete") {
          message = `*Wing Removed*: Wing *${data.wingName}* has been deleted.`;
        } else if (action === "import") {
          message = `*Bulk Import*: *${data.count || 1}* wings have been imported into the society.`;
        }
        societyId = data.societyId;
        break;
      case "role":
        if (action === "create" || action === "add") {
          message = `*New Role Created*: *${data.name}* is now available.`;
        } else if (action === "delete") {
          message = `*Role Removed*: *${data.name}* has been deleted.`;
        } else {
          message = `*Role ${actionText}*: *${data.name}*.`;
        }
        break;
      case "user":
        if (action === "create" || action === "add") {
          message = `*New System User*: *${data.fullName || data.email}* has been created.`;
        } else if (action === "update" || action === "edit") {
          message = `*User Profile Updated*: *${data.fullName || data.email}* details were changed.`;
        } else if (action === "delete") {
          message = `*User Removed*: *${data.fullName || data.email}* has been deleted.`;
        }
        societyId = data.societyId;
        break;
      default:
        message = `*${actionText}*: ${entityType} ${data.name || ''}`;
    }

    // 1. Get Super Admin Mobile Number
    let superAdminNumber: string | undefined;
    let superAdminSource = "None Found";

    // Priority 1: Check User Management for Super Admin
    const superAdminUser = db.query(`
      SELECT u.mobileNumber 
      FROM users u 
      JOIN roles r ON u.roleId = r.id 
      WHERE r.name = 'Super Admin' 
      LIMIT 1
    `).get() as { mobileNumber: string } | undefined;

    if (superAdminUser?.mobileNumber) {
      superAdminNumber = superAdminUser.mobileNumber;
      superAdminSource = "User Table (Role: Super Admin)";
    } else {
      // Priority 2: Fallback to Role Master (Role Table)
      const superAdminRole = db.query(`SELECT whatsappNumber, isWhatsApp FROM roles WHERE name = 'Super Admin' LIMIT 1`).get() as { whatsappNumber: string, isWhatsApp: number } | undefined;
      if (superAdminRole?.whatsappNumber && superAdminRole.isWhatsApp === 1) {
        superAdminNumber = superAdminRole.whatsappNumber;
        superAdminSource = "Role Table Fallback";
      }
    }

    // 2. Get Society Admin Notification Number
    let societyNotificationNumber: string | undefined;
    let societyAdminSource = "None Found";

    if (societyId) {
      // Priority 1: Check User Management for Society Admin in this society
      const societyAdminUser = db.query(`
        SELECT u.mobileNumber 
        FROM users u 
        JOIN roles r ON u.roleId = r.id 
        WHERE r.name = 'Society Admin' AND u.societyId = ? 
        LIMIT 1
      `).get(societyId) as { mobileNumber: string } | undefined;

      if (societyAdminUser?.mobileNumber) {
        societyNotificationNumber = societyAdminUser.mobileNumber;
        societyAdminSource = `User Table (Society ID: ${societyId})`;
      } else {
        // Priority 2: Check Society's own notification number
        const society = db.query(`
          SELECT whatsappNumber, isWhatsApp 
          FROM societies 
          WHERE id = ? 
          LIMIT 1
        `).get(societyId) as { whatsappNumber: string, isWhatsApp: number } | undefined;

        if (society?.whatsappNumber && society.isWhatsApp === 1) {
          societyNotificationNumber = society.whatsappNumber;
          societyAdminSource = "Society Settings";
        } else {
          // Priority 3: Fallback to Role Master (Role Table) Global Society Admin number
          const societyAdminRole = db.query(`SELECT whatsappNumber, isWhatsApp FROM roles WHERE name = 'Society Admin' LIMIT 1`).get() as { whatsappNumber: string, isWhatsApp: number } | undefined;
          if (societyAdminRole?.whatsappNumber && societyAdminRole.isWhatsApp === 1) {
            societyNotificationNumber = societyAdminRole.whatsappNumber;
            societyAdminSource = "Role Table Fallback (Global)";
          }
        }
      }
    }

    console.log(`[WhatsApp Recipient Discovery]:`);
    console.log(` - Super Admin: ${superAdminNumber || 'None'} (Source: ${superAdminSource})`);
    console.log(` - Society Admin: ${societyNotificationNumber || 'None'} (Source: ${societyAdminSource})`);

    // --- 🚀 [Automated Direct Delivery Flow] ---

    // 1. Send to Super Admin (with forwarding link if available)
    let superAdminSent = false;
    if (superAdminNumber) {
      console.log(`[WhatsApp -> Phase 1: Super Admin (${superAdminNumber})]: ${message}`);
      superAdminSent = await sendWhatsAppMessage(superAdminNumber, message);
    } else {
      console.warn("⚠️ No Super Admin mobile number found for primary notification.");
    }

    // 2. Automated Relay Fallback (System Notification)
    if (societyNotificationNumber) {
      // Deduplication: If Society Admin is the same as Super Admin, skip relay
      const normalize = (num: string) => num.replace(/\D/g, '').slice(-10);
      if (superAdminNumber && normalize(societyNotificationNumber) === normalize(superAdminNumber)) {
        console.log(`[WhatsApp -> Info]: Society Admin is same as Super Admin. Skipping redundant automated relay.`);
      } else {
        // Small delay to ensure sequential order
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`[WhatsApp -> Phase 2: Automated Delivery (${societyNotificationNumber})]: ${message}`);
        await sendWhatsAppMessage(societyNotificationNumber, message);
      }
    } else if (!superAdminSent) {
      console.log(`[WhatsApp Notification]: No recipients found (Super Admin).`);
    }

  } catch (error) {
    console.error("WhatsApp notification failed:", error);
  }
};

/**
 * 🔹 PROVIDER INTEGRATION 🔹
 * Sends a WhatsApp message using the configured provider (Twilio or Meta).
 */
const sendWhatsAppMessage = async (to: string, message: string): Promise<boolean> => {
  const provider = process.env.WHATSAPP_PROVIDER || "console"; // Default to console if not set

  if (!to) {
    console.warn("⚠️ No recipient number provided for WhatsApp notification.");
    return false;
  }

  // Ensure number format (basic cleanup)
  // Providers usually need E.164 format (e.g., +1234567890)
  const cleanNumber = to.replace(/\D/g, ''); // Remove non-digits
  const formattedNumber = cleanNumber.startsWith('91') ? `+${cleanNumber}` : `+91${cleanNumber}`; // Default to India (+91) if missing

  console.log(`[WhatsApp] Sending via ${provider} to ${formattedNumber}: ${message}`);

  try {
    if (provider === "twilio") {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_FROM_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        console.error("❌ Twilio credentials missing in .env");
        return false;
      }

      const body = new URLSearchParams();
      body.append("To", `whatsapp:${formattedNumber}`);
      body.append("From", fromNumber);
      body.append("Body", message);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("❌ Twilio API Error:", err);
        return false;
      } else {
        console.log("✅ Twilio message sent successfully!");
        return true;
      }

    } else if (provider === "meta") {
      const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
      const accessToken = process.env.META_ACCESS_TOKEN;

      if (!phoneNumberId || !accessToken) {
        console.error("❌ Meta API credentials missing in .env");
        if (!phoneNumberId) console.error("   - Missing META_PHONE_NUMBER_ID (Found in App Dashboard > WhatsApp > API Setup)");
        if (!accessToken) console.error("   - Missing META_ACCESS_TOKEN (Found in App Dashboard > WhatsApp > API Setup)");
        return false;
      }

      const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedNumber,
          type: "text",
          text: { body: message }
        })
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("❌ Meta API Error:", JSON.stringify(err, null, 2));
        return false;
      } else {
        const data = await response.json();
        console.log("✅ Meta message sent successfully!");
        console.log("Response Data:", JSON.stringify(data, null, 2));
        return true;
      }
    } else {
      // Console mock (already logged above)
      return true;
    }
  } catch (err) {
    console.error("❌ Failed to send WhatsApp message:", err);
    return false;
  }
};

const routes: Record<string, Record<string, (req: Request, params?: Record<string, string>) => Response | Promise<Response>>> = {
  "/": {
    async GET() {
      console.log("Serving index.html with cache busting");
      const file = Bun.file("dist/index.html");
      const text = await file.text();
      const timestamp = Date.now();
      const modified = text
        .replace(/src="([^"]+\.js)"/g, `src="$1?v=${timestamp}"`)
        .replace(/href="([^"]+\.css)"/g, `href="$1?v=${timestamp}"`);

      return new Response(modified, {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      });
    }
  },
  "/chunk-:name.js": {
    async GET(req, params) {
      const name = params?.name;
      console.log(`Serving chunk: ${name}.js`);
      const file = Bun.file(`dist/chunk-${name}.js`);
      return new Response(file, {
        headers: {
          "Content-Type": "text/javascript",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      });
    }
  },
  "/chunk-:name.js.map": {
    async GET(req, params) {
      const name = params?.name;
      const file = Bun.file(`dist/chunk-${name}.js.map`);
      return new Response(file, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      });
    }
  },
  "/chunk-:name.css": {
    async GET(req, params) {
      const name = params?.name;
      const file = Bun.file(`dist/chunk-${name}.css`);
      return new Response(file, {
        headers: {
          "Content-Type": "text/css",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      });
    }
  },
  "/logo.svg": {
    async GET() {
      const srcPath = "src/logo-final.png";
      const filePath = existsSync(srcPath) ? srcPath : "dist/logo-final.png";
      const file = Bun.file(filePath);
      return new Response(file, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
        }
      });
    }
  },
  "/favicon.ico": {
    async GET() {
      const srcPath = "src/logo-final.png";
      const filePath = existsSync(srcPath) ? srcPath : "dist/logo-final.png";
      const file = Bun.file(filePath);
      return new Response(file, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
        }
      });
    }
  },
  "/logo-final.png": {
    async GET() {
      const srcPath = "src/logo-final.png";
      const filePath = existsSync(srcPath) ? srcPath : "dist/logo-final.png";
      const file = Bun.file(filePath);
      return new Response(file, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
        }
      });
    }
  },

  /* 🔹 STATIC FILES 🔹 */
  "/uploads/:filename": {
    async GET(req, params) {
      const filename = params?.filename;
      const path = `public/uploads/${filename}`;
      const file = Bun.file(path);
      const ext = (filename?.split(".").pop() || "").toLowerCase();
      const types: Record<string, string> = {
        pdf: "application/pdf",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        webp: "image/webp",
        gif: "image/gif",
      };
      const contentType = types[ext] || (file as any).type || "application/octet-stream";
      return new Response(file, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }
  },

  /* 🔹 IMPORT API 🔹 */
  // CORS helpers (useful if the browser sends a preflight OPTIONS request)
  "/api/import/cors-headers": {
    async GET() {
      return Response.json({
        allowOrigin: "*",
        allowMethods: "POST, OPTIONS",
        allowHeaders: "Content-Type, x-user-role, x-society-id, x-member-id"
      });
    }
  },
  "/api/import/preview": {
    async OPTIONS() {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, x-user-role, x-society-id, x-member-id",
        }
      });
    },
    async GET() {
      return Response.json({ success: false, message: "Method Not Allowed. Use POST for preview." }, { status: 405 });
    },
    async POST(req) {
      const contentType = req.headers.get("content-type") || "";
      let uploadFilename = "";
      let importRows: any[] = [];
      let jsonData: any = null;

      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (inQuotes) {
            if (ch === '"') {
              if (line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = false;
              }
            } else {
              current += ch;
            }
          } else {
            if (ch === '"') {
              inQuotes = true;
            } else if (ch === ',') {
              result.push(current);
              current = "";
            } else {
              current += ch;
            }
          }
        }
        result.push(current);
        return result;
      };
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


      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        for (const [, value] of formData.entries()) {
          if (value instanceof File) {
            uploadFilename = value.name || "";
            const ext = (uploadFilename.split(".").pop() || "").toLowerCase();
            if (ext === "csv") {
              const text = await value.text();
              const rows = text.split(/\r?\n/).filter(l => l.trim().length > 0);
              const headerLine = rows.shift();
              if (!headerLine) {
                return Response.json({ success: false, message: "CSV has no header row" }, { status: 400 });
              }
              const headers = parseCsvLine(headerLine);
              for (const line of rows) {
                const cols = parseCsvLine(line);
                if (cols.length === 0) continue;
                const row: Record<string, string> = {};
                headers.forEach((h, i) => { row[h.trim()] = (cols[i] || "").trim(); });
                importRows.push(row);
              }
            } else if (ext === "xlsx") {
              const buf = await value.arrayBuffer();
              const wb = XLSX.read(buf, { type: "array" });
              const sheetName = wb.SheetNames[0];
              const sheet = wb.Sheets[sheetName];
              importRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
            } else {
              const text = await value.text();
              try {
                jsonData = JSON.parse(text);
              } catch {
                return Response.json({ success: false, message: "Unsupported file format. Please upload Excel (.xlsx) or CSV." }, { status: 400 });
              }
            }
            break;
          }
        }
      } else if (contentType.includes("text/csv")) {
        const text = await req.text();
        const rows = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        const headerLine = rows.shift();
        if (!headerLine) {
          return Response.json({ success: false, message: "CSV has no header row" }, { status: 400 });
        }
        const headers = parseCsvLine(headerLine);
        for (const line of rows) {
          const cols = parseCsvLine(line);
          if (cols.length === 0) continue;
          const row: Record<string, string> = {};
          headers.forEach((h, i) => { row[h.trim()] = (cols[i] || "").trim(); });
          importRows.push(row);
        }
      } else {
        return Response.json({ success: false, message: "Expected CSV or Excel file" }, { status: 400 });
      }

      let societiesInput: any[] = [];
      let wingsInput: any[] = [];
      let membersInput: any[] = [];

      if (importRows.length > 0) {
        const normalize = (s: string) => (s || "").trim();
        const wingFlatMap = new Map<string, Set<string>>();
        for (const r of importRows) {
          const societyName = normalize(getVal(r, ["Society", "Society Name", "society"]));
          const wingName = normalize(getVal(r, ["Wing", "wing", "Wing Name"]));
          const flatNumber = normalize(getVal(r, ["Flat", "Flat Number", "flatNumber", "flat"]));
          const name = normalize(getVal(r, ["Member Name", "Name", "name"]));
          const memberType = normalize(getVal(r, ["Type", "Member Type", "memberType"])) || "Owner";
          const ownerName = normalize(getVal(r, ["Owner Name", "Owner", "ownerName"]));
          const gender = normalize(getVal(r, ["Gender", "gender"]));
          const mobileNumber = normalize(getVal(r, ["Mobile", "Mobile Number", "mobileNumber", "Phone"]));
          const email = normalize(getVal(r, ["Email", "email", "E-mail"]));
          const vehicleType = normalize(getVal(r, ["Vehicle Type", "vehicleType"]));
          const vehicleNumber = normalize(getVal(r, ["Vehicle Number", "vehicleNumber"]));
          const status = "Pending";
          membersInput.push({
            societyName,
            wingName,
            flatNumber,
            name,
            memberType,
            ownerName: memberType.toLowerCase() === "tenant" ? (ownerName || null) : null,
            gender,
            mobileNumber,
            email,
            vehicleType,
            vehicleNumber,
            status
          });
          const key = `${societyName}||${wingName}`;
          if (!wingFlatMap.has(key)) wingFlatMap.set(key, new Set<string>());
          if (flatNumber) wingFlatMap.get(key)!.add(flatNumber);
        }
        for (const [key, setFlats] of wingFlatMap.entries()) {
          const [societyName, wingName] = key.split("||");
          wingsInput.push({
            societyName,
            wingName,
            flats: Array.from(setFlats)
          });
        }
        // Preview societies derived from input
        const societySet = new Set<string>();
        for (const m of membersInput) {
          if (m.societyName) societySet.add(m.societyName);
        }
        societiesInput = Array.from(societySet).map(name => ({ name, numberOfWings: 0 }));
      } else {
        return Response.json({ success: false, message: "No valid import data provided" }, { status: 400 });
      }

      return Response.json({
        success: true,
        preview: {
          societies: societiesInput,
          wings: wingsInput,
          members: membersInput
        },
        counts: {
          societies: societiesInput.length,
          wings: wingsInput.length,
          members: membersInput.length
        },
        filename: uploadFilename
      });
    }
  },
  "/api/import": {
    async OPTIONS() {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, x-user-role, x-society-id, x-member-id",
        }
      });
    },
    async GET() {
      return Response.json({ success: false, message: "Method Not Allowed. Use POST to import." }, { status: 405 });
    },
    async POST(req) {
      const role = req.headers.get("x-user-role");
      const societyIdHeader = req.headers.get("x-society-id");
      const contentType = req.headers.get("content-type") || "";
      let uploadFilename = "";
      let importRows: any[] = [];
      let jsonData: any = null;

      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (inQuotes) {
            if (ch === '"') {
              if (line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = false;
              }
            } else {
              current += ch;
            }
          } else {
            if (ch === '"') {
              inQuotes = true;
            } else if (ch === ',') {
              result.push(current);
              current = "";
            } else {
              current += ch;
            }
          }
        }
        result.push(current);
        return result;
      };
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

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        for (const [, value] of formData.entries()) {
          if (value instanceof File) {
            uploadFilename = value.name || "";
            const ext = (uploadFilename.split(".").pop() || "").toLowerCase();
            if (ext === "csv") {
              const text = await value.text();
              const rows = text.split(/\r?\n/).filter(l => l.trim().length > 0);
              const headerLine = rows.shift();
              if (!headerLine) {
                return Response.json({ success: false, message: "CSV has no header row" }, { status: 400 });
              }
              const headers = parseCsvLine(headerLine);
              for (const line of rows) {
                const cols = parseCsvLine(line);
                if (cols.length === 0) continue;
                const row: Record<string, string> = {};
                headers.forEach((h, i) => { row[h.trim()] = (cols[i] || "").trim(); });
                importRows.push(row);
              }
            } else if (ext === "xlsx") {
              try {
                const buf = await value.arrayBuffer();
                const wb = XLSX.read(buf, { type: "array" });
                const sheetName = wb.SheetNames?.[0];
                if (!sheetName) {
                  return Response.json({ success: false, message: "Excel file has no sheets" }, { status: 400 });
                }
                const sheet = wb.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
                importRows = rows;
              } catch (e) {
                return Response.json({ success: false, message: "Failed to read Excel file" }, { status: 400 });
              }
            } else {
              try {
                const text = await value.text();
                jsonData = JSON.parse(text);
              } catch (e) {
                return Response.json({ success: false, message: "Unsupported file format. Please upload Excel (.xlsx) or CSV." }, { status: 400 });
              }
            }
            break;
          }
        }
      } else {
        if (contentType.includes("text/csv")) {
          const text = await req.text();
          const rows = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          const headerLine = rows.shift();
          if (!headerLine) {
            return Response.json({ success: false, message: "CSV has no header row" }, { status: 400 });
          }
          const headers = parseCsvLine(headerLine);
          for (const line of rows) {
            const cols = parseCsvLine(line);
            if (cols.length === 0) continue;
            const row: Record<string, string> = {};
            headers.forEach((h, i) => { row[h.trim()] = (cols[i] || "").trim(); });
            importRows.push(row);
          }
        } else {
          try {
            jsonData = await req.json();
          } catch {
            return Response.json({ success: false, message: "Expected CSV or Excel body" }, { status: 400 });
          }
        }
      }

      let societiesInput: any[] = [];
      let wingsInput: any[] = [];
      let membersInput: any[] = [];

      if (importRows.length > 0) {
        const normalize = (s: string) => (s || "").trim();
        const wingFlatMap = new Map<string, Set<string>>();
        for (const r of importRows) {
          const societyName = normalize(getVal(r, ["Society", "Society Name", "society"]));
          const wingName = normalize(getVal(r, ["Wing", "wing", "Wing Name"]));
          const flatNumber = normalize(getVal(r, ["Flat", "Flat Number", "flatNumber", "flat"]));
          const name = normalize(getVal(r, ["Member Name", "Name", "name"]));
          const memberType = normalize(getVal(r, ["Type", "Member Type", "memberType"])) || "Owner";
          const ownerName = normalize(getVal(r, ["Owner Name", "Owner", "ownerName"]));
          const gender = normalize(getVal(r, ["Gender", "gender"]));
          const mobileNumber = normalize(getVal(r, ["Mobile", "Mobile Number", "mobileNumber", "Phone"]));
          const email = normalize(getVal(r, ["Email", "email", "E-mail"]));
          const vehicleType = normalize(getVal(r, ["Vehicle Type", "vehicleType"]));
          const vehicleNumber = normalize(getVal(r, ["Vehicle Number", "vehicleNumber"]));
          const status = "Pending";
          membersInput.push({
            societyName,
            wingName,
            flatNumber,
            name,
            memberType,
            ownerName: memberType.toLowerCase() === "tenant" ? (ownerName || null) : null,
            gender,
            mobileNumber,
            email,
            vehicleType,
            vehicleNumber,
            status
          });
          const key = `${societyName}||${wingName}`;
          if (!wingFlatMap.has(key)) wingFlatMap.set(key, new Set<string>());
          if (flatNumber) wingFlatMap.get(key)!.add(flatNumber);
        }
        for (const [key, setFlats] of wingFlatMap.entries()) {
          const [societyName, wingName] = key.split("||");
          wingsInput.push({
            societyName,
            wingName,
            flats: Array.from(setFlats)
          });
        }
      } else if (jsonData && typeof jsonData === "object") {
        societiesInput = Array.isArray(jsonData.societies) ? jsonData.societies : [];
        wingsInput = Array.isArray(jsonData.wings) ? jsonData.wings : [];
        membersInput = Array.isArray(jsonData.members) ? jsonData.members : [];
      } else {
        return Response.json({ success: false, message: "No valid import data provided" }, { status: 400 });
      }

      const messages: string[] = [];
      let importedSocieties = 0;
      let importedWings = 0;
      let importedMembers = 0;
      const actor = getActorFromHeaders(req);

      // Helper: get or create society by name
      const getOrCreateSocietyId = (name: string, numberOfWings?: number) => {
        const row = db.query("SELECT id FROM societies WHERE name = ?").get(name) as any;
        if (row && row.id) return row.id;
        const res = db.prepare("INSERT INTO societies (name, numberOfWings) VALUES (?, ?)").run(name, numberOfWings || 0);
        importedSocieties++;
        createLog({
          action: "create",
          entityType: "society",
          entityId: Number(res.lastInsertRowid),
          entityName: typeof name === "string" ? name.trim() : "",
          actorUserId: actor.actorUserId,
          actorMemberId: actor.actorMemberId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          societyId: Number(res.lastInsertRowid),
        });
        return res.lastInsertRowid as number;
      };

      // Scope handling
      let scope = "global";
      const societyId = societyIdHeader ? Number(societyIdHeader) : null;
      if (role === "Society Admin" && societyId) {
        scope = "society";
      } else if (role === "Super Admin") {
        scope = "super-admin";
      }

      // Import Societies
      if (scope === "super-admin") {
        for (const s of societiesInput) {
          if (!s || !s.name) continue;
          getOrCreateSocietyId(s.name, s.numberOfWings);
        }
      } else if (scope === "society" && societyId) {
        // Ensure assigned society exists
        const currentSocietyRow = db.query("SELECT * FROM societies WHERE id = ?").get(societyId) as any;
        if (!currentSocietyRow) {
          messages.push("Assigned society not found; creating from first societies entry if provided.");
          if (societiesInput[0] && societiesInput[0].name) {
            // create with header societyId
            db.prepare("INSERT INTO societies (id, name, numberOfWings) VALUES (?, ?, ?)").run(
              societyId,
              societiesInput[0].name,
              societiesInput[0].numberOfWings || 0
            );
            importedSocieties++;
            createLog({
              action: "create",
              entityType: "society",
              entityId: Number(societyId),
              entityName: typeof societiesInput[0].name === "string" ? societiesInput[0].name.trim() : "",
              actorUserId: actor.actorUserId,
              actorMemberId: actor.actorMemberId,
              actorName: actor.actorName,
              actorRole: actor.actorRole,
              societyId: Number(societyId),
            });
          }
        }
      }

      // Import Wings
      for (const w of wingsInput) {
        if (!w) continue;
        const societyName = w.societyName || w.society || null;
        let targetSocietyId: number | null = null;
        if (scope === "society" && societyId) {
          targetSocietyId = societyId;
        } else if (societyName) {
          targetSocietyId = getOrCreateSocietyId(societyName);
        } else if (typeof w.societyId === "number") {
          targetSocietyId = w.societyId;
        }
        if (!targetSocietyId) continue;
        const wingName = w.wingName || w.name;
        const flatsStr = Array.isArray(w.flats) ? w.flats.join(", ") : (w.flats || "");
        const existingWing = db.query("SELECT * FROM wings WHERE societyId = ? AND wingName = ?").get(targetSocietyId, wingName) as any;
        if (existingWing) {
          const existingFlats = (existingWing.flats || "").split(",").map((f: string) => f.trim()).filter((f: string) => f);
          const newFlats = flatsStr.split(",").map((f: string) => f.trim()).filter((f: string) => f);
          const set = new Set<string>([...existingFlats, ...newFlats]);
          const merged = Array.from(set).join(", ");
          db.prepare("UPDATE wings SET flats=? WHERE id=?").run(merged, existingWing.id);
        } else {
          const res = db.prepare("INSERT INTO wings (societyId, wingName, flats) VALUES (?, ?, ?)").run(targetSocietyId, wingName, flatsStr);
          importedWings++;
          createLog({
            action: "create",
            entityType: "wing",
            entityId: Number(res.lastInsertRowid),
            entityName: typeof wingName === "string" ? wingName.trim() : "",
            actorUserId: actor.actorUserId,
            actorMemberId: actor.actorMemberId,
            actorName: actor.actorName,
            actorRole: actor.actorRole,
            societyId: targetSocietyId,
          });
        }
      }

      // Import Members
      for (const m of membersInput) {
        if (!m) continue;
        let targetSocietyId: number | null = null;
        let targetSocietyName: string | null = null;
        if (scope === "society" && societyId) {
          const row = db.query("SELECT name FROM societies WHERE id = ?").get(societyId) as any;
          targetSocietyId = societyId;
          targetSocietyName = row?.name || (m.societyName || "");
        } else {
          const societyName = m.societyName || m.society || null;
          if (societyName) {
            targetSocietyId = getOrCreateSocietyId(societyName);
            targetSocietyName = societyName;
          } else if (typeof m.societyId === "number") {
            targetSocietyId = m.societyId;
            const row = db.query("SELECT name FROM societies WHERE id = ?").get(targetSocietyId) as any;
            targetSocietyName = row?.name || "";
          }
        }
        if (!targetSocietyId) continue;

        const insert = db.prepare(`
            INSERT INTO members (
              name, societyId, societyName, wingName, flatNumber,
              memberType, ownerName, gender, mobileNumber, email,
              vehicleType, vehicleNumber, status, documents
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

        const res = insert.run(
          typeof m.name === "string" ? m.name.trim() : "",
          targetSocietyId,
          typeof targetSocietyName === "string" ? targetSocietyName.trim() : "",
          typeof m.wingName === "string" ? m.wingName.trim() : "",
          typeof m.flatNumber === "string" ? m.flatNumber.trim() : "",
          typeof m.memberType === "string" ? m.memberType.trim() : "Owner",
          m.ownerName || null,
          typeof m.gender === "string" ? m.gender.trim() : "",
          typeof m.mobileNumber === "string" ? m.mobileNumber.trim() : "",
          typeof m.email === "string" ? m.email.trim() : "",
          m.vehicleType || null,
          m.vehicleNumber || null,
          "Pending",
          m.documents || null
        );
        importedMembers++;
        createLog({
          action: "create",
          entityType: "member",
          entityId: Number(res.lastInsertRowid),
          entityName: typeof m.name === "string" ? m.name.trim() : "",
          actorUserId: actor.actorUserId,
          actorMemberId: actor.actorMemberId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          societyId: targetSocietyId,
        });

        // WhatsApp Notification: ADD -> Notify Super Admin & Society Admin
        // notifyWhatsApp("create", "member", { ... }); // Individual per-member might be too much, summary below
      }

      if (importedSocieties > 0) {
        notifyWhatsApp("import", "society", { count: importedSocieties });
      }

      let targetNameForSummary = "";
      if (societyIdHeader) {
        const row = db.query("SELECT name FROM societies WHERE id = ?").get(societyIdHeader) as any;
        targetNameForSummary = row?.name || "";
      }

      if (importedWings > 0) {
        notifyWhatsApp("import", "wing", {
          count: importedWings,
          societyId: societyIdHeader ? Number(societyIdHeader) : null,
          societyName: targetNameForSummary
        });
      }
      if (importedMembers > 0) {
        notifyWhatsApp("import", "member", {
          count: importedMembers,
          societyId: societyIdHeader ? Number(societyIdHeader) : null,
          societyName: targetNameForSummary
        });
      }

      return Response.json({
        success: true,
        scope,
        counts: {
          societies: importedSocieties,
          wings: importedWings,
          members: importedMembers,
        },
        messages,
      });
    }
  },

  "/api/import/members": {
    async POST(req) {
      const actor = getActorFromHeaders(req);
      const { members, societyId, societyName } = await req.json();

      // Existing logic for bulk-create handles its own WhatsApp per member
      // but maybe a summary here?

      return Response.json({ success: true });
    }
  },

  // SPA fallback: serve index.html for any non-API, non-static path
  "/*": {
    async GET(req) {
      const url = new URL(req.url);
      const pathname = url.pathname;
      if (pathname.startsWith("/api/")) {
        return Response.json({ message: "Not Found" }, { status: 404 });
      }
      const filename = pathname.slice(1);
      const ext = (filename.split(".").pop() || "").toLowerCase();
      const types: Record<string, string> = {
        js: "text/javascript",
        css: "text/css",
        map: "application/json",
        html: "text/html",
        svg: "image/svg+xml",
        ico: "image/x-icon",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        webp: "image/webp",
        gif: "image/gif"
      };
      if (filename && types[ext]) {
        if (filename === "new-logo.png") {
          const file = Bun.file("src/new-logo.png");
          return new Response(file, { headers: { "Content-Type": "image/png" } });
        }
        const distPath = `dist/${filename}`;
        const file = Bun.file(distPath);
        if (await file.exists()) {
          return new Response(file, { headers: { "Content-Type": types[ext] } });
        }
        return new Response("Not Found", { status: 404 });
      }
      const indexFile = Bun.file("dist/index.html");
      return new Response(indexFile, { headers: { "Content-Type": "text/html" } });
    }
  },
  /* 🔹 SOCIETIES API 🔹 */

  // GET: Fetch all societies
  "/api/societies": {
    async GET(req) {
      const role = req.headers.get("x-user-role");
      const societyId = req.headers.get("x-society-id");

      if ((role === "Society Admin" || role === "Member") && societyId) {
        return Response.json(db.query("SELECT * FROM societies WHERE id = ?").all(societyId));
      }
      const query = db.query("SELECT * FROM societies ORDER BY id ASC");
      return Response.json(query.all());
    },
    // POST: Create a new society
    async POST(req) {
      const body = await req.json();
      const { name, numberOfWings, whatsappNumber, isWhatsApp } = body;

      const insert = db.prepare("INSERT INTO societies (name, numberOfWings, whatsappNumber, isWhatsApp) VALUES (?, ?, ?, ?)");
      const result = insert.run(name, numberOfWings, whatsappNumber || null, isWhatsApp ? 1 : 0);

      const actor = getActorFromHeaders(req);
      createLog({
        action: "create",
        entityType: "society",
        entityId: Number(result.lastInsertRowid),
        entityName: typeof name === "string" ? name.trim() : "",
        actorUserId: actor.actorUserId,
        actorMemberId: actor.actorMemberId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        societyId: Number(result.lastInsertRowid),
      });

      notifyWhatsApp("create", "society", { name, id: result.lastInsertRowid });

      return Response.json({ id: result.lastInsertRowid, name, numberOfWings });
    },
  },

  // PUT: Update a society
  "/api/societies/:id": {
    async PUT(req) {
      const id = req.params.id;
      const body = await req.json();
      const { name, numberOfWings, whatsappNumber, isWhatsApp } = body;
      const actor = getActorFromHeaders(req);

      const existingSociety = db.query("SELECT * FROM societies WHERE id = ?").get(id) as any;

      const update = db.prepare("UPDATE societies SET name = ?, numberOfWings = ?, whatsappNumber = ?, isWhatsApp = ? WHERE id = ?");
      update.run(name, numberOfWings, whatsappNumber || null, isWhatsApp ? 1 : 0, id);

      // Sync with Users table (Society Admin)
      if (whatsappNumber) {
        db.prepare(`
          UPDATE users 
          SET mobileNumber = ? 
          WHERE societyId = ? AND roleId = (SELECT id FROM roles WHERE name = 'Society Admin')
        `).run(whatsappNumber, id);
      }

      if (existingSociety) {
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
    // DELETE: Delete a society
    async DELETE(req) {
      const id = req.params.id;
      const actor = getActorFromHeaders(req);
      const existingSociety = db.query("SELECT * FROM societies WHERE id = ?").get(id) as any;
      // First delete members of this society
      db.prepare("DELETE FROM members WHERE societyId = ?").run(id);
      // Then delete society
      db.prepare("DELETE FROM societies WHERE id = ?").run(id);
      if (existingSociety) {
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
    },
  },

  /* 🔹 MEMBERS API 🔹 */

  // GET: Fetch all members
  "/api/members": {
    async GET(req) {
      const role = req.headers.get("x-user-role");
      const societyId = req.headers.get("x-society-id");
      const memberId = req.headers.get("x-member-id");

      if (role === "Society Admin" && societyId) {
        const members = db.query("SELECT * FROM members WHERE societyId = ? ORDER BY id DESC").all(societyId);
        console.log("Society Admin - /api/members response:", members);
        return Response.json(members);
      }
      if (role === "Member" && memberId) {
        const memberRow = db.query("SELECT * FROM members WHERE id = ?").get(memberId) as any;
        console.log("Member - /api/members response:", memberRow);
        if (!memberRow || Number(memberRow.canRead ?? 1) !== 1) {
          return Response.json({ success: false, message: "Access denied" }, { status: 403 });
        }
        return Response.json([memberRow]);
      }

      const query = db.query("SELECT * FROM members ORDER BY id DESC");
      const allMembers = query.all();
      console.log("Super Admin/No Role - /api/members response:", allMembers);
      return Response.json(allMembers);
    },
    // POST: Create a new member
    async POST(req) {
      let body;
      let documents = "";

      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        body = {};
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            const fileName = `${Date.now()}-${value.name}`;
            await Bun.write(`public/uploads/${fileName}`, value);
            documents = `/uploads/${fileName}`;
          } else {
            body[key] = value;
          }
        }
      } else {
        body = await req.json();
      }

      if (!documents) {
        // Document upload is optional now
        // return Response.json({ success: false, message: "Document upload required" }, { status: 400 });
      }

      const {
        name, societyId, societyName, wingName, flatNumber,
        memberType, ownerName, gender, mobileNumber, email,
        vehicleType, vehicleNumber, roleType
      } = body;

      const insert = db.prepare(`
          INSERT INTO members (
            name, societyId, societyName, wingName, flatNumber, 
            memberType, ownerName, gender, mobileNumber, email, 
            vehicleType, vehicleNumber, status, documents, roleType, canRead, canEdit, canDelete
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, 1, 0, 0)
        `);

      const result = insert.run(
        typeof name === "string" ? name.trim() : "",
        Number(societyId),
        typeof societyName === "string" ? societyName.trim() : "",
        typeof wingName === "string" ? wingName.trim() : "",
        typeof flatNumber === "string" ? flatNumber.trim() : "",
        typeof memberType === "string" ? memberType.trim() : "Owner",
        ownerName || null,
        typeof gender === "string" ? gender.trim() : "",
        typeof mobileNumber === "string" ? mobileNumber.trim() : "",
        typeof email === "string" ? email.trim() : "",
        vehicleType || null,
        vehicleNumber || null,
        documents,
        typeof roleType === "string" ? roleType.trim() : "Society Member"
      );

      const actor = getActorFromHeaders(req);
      createLog({
        action: "create",
        entityType: "member",
        entityId: Number(result.lastInsertRowid),
        entityName: typeof name === "string" ? name.trim() : "",
        actorUserId: actor.actorUserId,
        actorMemberId: actor.actorMemberId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        societyId: societyId ? Number(societyId) : actor.societyId,
      });

      // WhatsApp Notification: ADD -> Notify Super Admin & Society Admin
      // WhatsApp Notification: ADD -> Notify Super Admin & Society Admin
      notifyWhatsApp("create", "member", {
        name,
        mobileNumber,
        societyName,
        societyId: societyId ? Number(societyId) : actor.societyId
      });

      return Response.json({ id: result.lastInsertRowid, ...body, status: 'Pending', documents });
    },
  },

  // PUT: Update a member
  "/api/members/:id": {
    async PUT(req) {
      const id = req.params.id;
      const role = req.headers.get("x-user-role");
      const userMemberId = req.headers.get("x-member-id");
      const actor = getActorFromHeaders(req);

      const existingMember = db.query("SELECT * FROM members WHERE id = ?").get(id) as any;
      if (!existingMember) {
        return Response.json({ success: false, message: "Member not found" }, { status: 404 });
      }

      // Permission check
      if (role === "Member") {
        if (id !== userMemberId) {
          return Response.json({ success: false, message: "Unauthorized to edit other members" }, { status: 403 });
        }
        if (Number(existingMember.canEdit ?? 0) !== 1) {
          return Response.json({ success: false, message: "Edit access denied" }, { status: 403 });
        }
      }

      let body;
      let newDocument = null;
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        body = {};
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            const fileName = `${Date.now()}-${value.name}`;
            await Bun.write(`public/uploads/${fileName}`, value);
            newDocument = `/uploads/${fileName}`;
          } else {
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

      // Determine new status and documents
      let currentStatus = "Pending"; // Default fallback
      let currentDocuments = "";

      currentStatus = existingMember.status;
      currentDocuments = existingMember.documents || "";

      // Handle Status Update Permissions
      if (status && status !== currentStatus) {
        if (role === "Society Admin" || role === "Super Admin") {
          currentStatus = status;
        } else {
          // Members cannot change their own status directly
          // But if they upload a document, status might reset to Pending (logic below)
        }
      }

      // Handle Document Update
      if (newDocument) {
        currentDocuments = newDocument; // Overwrite or append? Let's overwrite for now as per "uploads a document"
        // If member uploads document, set status to Pending
        if (role === "Member") {
          currentStatus = "Pending";
        }
      }
      // Enforce document presence on update
      if (!currentDocuments) {
        return Response.json({ success: false, message: "Document upload required for update" }, { status: 400 });
      }

      const nextRoleType = roleType || existingMember.roleType || 'Society Member';

      // If changed to System User, ensure they only have view permission
      let nextCanRead = existingMember.canRead;
      let nextCanEdit = existingMember.canEdit;
      let nextCanDelete = existingMember.canDelete;

      if (nextRoleType === "System User") {
        nextCanRead = 1;
        nextCanEdit = 0;
        nextCanDelete = 0;
      }

      const update = db.prepare(`
          UPDATE members SET 
            name=?, societyId=?, societyName=?, wingName=?, flatNumber=?, 
            memberType=?, ownerName=?, gender=?, mobileNumber=?, email=?, 
            vehicleType=?, vehicleNumber=?, status=?, documents=?, roleType=?,
            canRead=?, canEdit=?, canDelete=?
          WHERE id=?
        `);

      update.run(
        name || existingMember.name,
        societyId || existingMember.societyId,
        societyName || existingMember.societyName,
        wingName || existingMember.wingName,
        flatNumber || existingMember.flatNumber,
        memberType || existingMember.memberType,
        ownerName || existingMember.ownerName,
        gender || existingMember.gender,
        mobileNumber || existingMember.mobileNumber,
        email || existingMember.email,
        vehicleType || existingMember.vehicleType,
        vehicleNumber || existingMember.vehicleNumber,
        currentStatus,
        currentDocuments,
        nextRoleType,
        nextCanRead,
        nextCanEdit,
        nextCanDelete,
        id
      );

      if (existingMember) {
        const statusChanged = existingMember.status !== currentStatus;
        // Trigger notification if status changed to Active OR if explicitly set to Active in a payload likely intended for approval
        const approved = (statusChanged && currentStatus === "Active") || (body.status === "Active");
        if (approved) {
          createLog({
            action: "document_approve",
            entityType: "member",
            entityId: Number(id),
            entityName: existingMember.name || "",
            actorUserId: actor.actorUserId,
            actorMemberId: actor.actorMemberId,
            actorName: actor.actorName,
            actorRole: actor.actorRole,
            societyId: existingMember.societyId ? Number(existingMember.societyId) : actor.societyId,
          });

          notifyWhatsApp("approve", "member", {
            name: existingMember.name,
            societyName: existingMember.societyName,
            societyId: existingMember.societyId
          });
        }
        if (newDocument) {
          createLog({
            action: "document_update",
            entityType: "member",
            entityId: Number(id),
            entityName: existingMember.name || "",
            actorUserId: actor.actorUserId,
            actorMemberId: actor.actorMemberId,
            actorName: actor.actorName,
            actorRole: actor.actorRole,
            societyId: existingMember.societyId ? Number(existingMember.societyId) : actor.societyId,
          });
        }
        createLog({
          action: "update",
          entityType: "member",
          entityId: Number(id),
          entityName: existingMember.name || "",
          actorUserId: actor.actorUserId,
          actorMemberId: actor.actorMemberId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          societyId: existingMember.societyId ? Number(existingMember.societyId) : actor.societyId,
        });

        // WhatsApp Notification: EDIT -> Notify Society Admin
        // WhatsApp Notification: EDIT -> Notify Society Admin
        notifyWhatsApp("update", "member", {
          name: name || existingMember.name,
          societyId: societyId || existingMember.societyId,
          societyName: societyName || existingMember.societyName
        });
      }

      return Response.json({ success: true, status: currentStatus, documents: currentDocuments });
    },
    // DELETE: Delete a member
    async DELETE(req) {
      const id = req.params.id;
      const role = req.headers.get("x-user-role");
      const userMemberId = req.headers.get("x-member-id");
      const actor = getActorFromHeaders(req);

      const existingMember = db.query("SELECT * FROM members WHERE id = ?").get(id) as any;
      if (!existingMember) {
        return Response.json({ success: false, message: "Member not found" }, { status: 404 });
      }

      if (role === "Member") {
        if (id !== userMemberId) {
          return Response.json({ success: false, message: "Unauthorized to delete other members" }, { status: 403 });
        }
        if (Number(existingMember.canDelete ?? 0) !== 1) {
          return Response.json({ success: false, message: "Delete access denied" }, { status: 403 });
        }
      }

      db.prepare("DELETE FROM members WHERE id = ?").run(id);
      if (existingMember) {
        createLog({
          action: "delete",
          entityType: "member",
          entityId: Number(id),
          entityName: existingMember.name || "",
          actorUserId: actor.actorUserId,
          actorMemberId: actor.actorMemberId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          societyId: existingMember.societyId ? Number(existingMember.societyId) : actor.societyId,
        });

        // WhatsApp Notification: DELETE -> Notify Super Admin & Society Admin
        // WhatsApp Notification: DELETE -> Notify Super Admin & Society Admin
        notifyWhatsApp("delete", "member", {
          name: existingMember.name,
          societyName: existingMember.societyName,
          societyId: existingMember.societyId
        });
      }
      return Response.json({ success: true });
    },
  },

  "/api/members/:id/permissions": {
    async PUT(req) {
      const id = req.params.id;
      const role = req.headers.get("x-user-role");
      const societyId = req.headers.get("x-society-id");

      if (role !== "Society Admin" && role !== "Super Admin") {
        return Response.json({ success: false, message: "Unauthorized" }, { status: 403 });
      }

      const existingMember = db.query("SELECT * FROM members WHERE id = ?").get(id) as any;
      if (!existingMember) {
        return Response.json({ success: false, message: "Member not found" }, { status: 404 });
      }

      if (role === "Society Admin" && societyId && Number(existingMember.societyId) !== Number(societyId)) {
        return Response.json({ success: false, message: "Unauthorized" }, { status: 403 });
      }

      const { canRead, canEdit, canDelete } = await req.json();

      // If it's a System User, they can ONLY have read permission
      if (existingMember.roleType === "System User" && (canEdit || canDelete)) {
        return Response.json({ success: false, message: "System Users can only have view permission" }, { status: 400 });
      }

      const nextCanRead = canRead ? 1 : 0;
      const nextCanEdit = canEdit ? 1 : 0;
      const nextCanDelete = canDelete ? 1 : 0;

      db.prepare("UPDATE members SET canRead=?, canEdit=?, canDelete=? WHERE id=?").run(
        nextCanRead,
        nextCanEdit,
        nextCanDelete,
        id
      );

      return Response.json({ success: true, canRead: nextCanRead, canEdit: nextCanEdit, canDelete: nextCanDelete });
    },
  },

  "/api/members/bulk-create": {
    async OPTIONS() {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, x-user-role, x-society-id, x-member-id",
        }
      });
    },
    async POST(req) {
      console.log("Received POST request for /api/members/bulk-create");
      console.log("Incoming Request Headers:", Object.fromEntries(req.headers.entries()));
      const actor = getActorFromHeaders(req);
      console.log("Actor from headers:", actor);
      const role = actor.actorRole;
      const societyId = actor.societyId;

      if (role !== "Society Admin" && role !== "Super Admin") {
        return Response.json({ success: false, message: "Unauthorized" }, { status: 403 });
      }

      if (role === "Society Admin" && !societyId) {
        return Response.json({ success: false, message: "Society Admin must be associated with a society" }, { status: 403 });
      }

      const membersToCreate = await req.json();
      if (!Array.isArray(membersToCreate)) {
        return Response.json({ success: false, message: "Request body must be an array of members" }, { status: 400 });
      }

      let successfulImports = 0;
      let failedImports = 0;
      const errors: any[] = [];

      for (const member of membersToCreate) {
        try {
          // Ensure societyId is correctly set for Society Admin
          const memberSocietyId = role === "Society Admin" ? societyId : member.societyId;
          console.log("Before insertion - member.societyId:", member.societyId);
          console.log("Before insertion - member.societyName:", member.societyName);
          console.log("Before insertion - calculated memberSocietyId:", memberSocietyId);
          if (!memberSocietyId) {
            throw new Error("Society ID is required for member creation.");
          }

          const insert = db.prepare(`
              INSERT INTO members (
                name, societyId, societyName, wingName, flatNumber,
                memberType, ownerName, gender, mobileNumber, email,
                vehicleType, vehicleNumber, status, documents, roleType, canRead, canEdit, canDelete
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

          const result = insert.run(
            member.name || "",
            memberSocietyId,
            member.societyName || "",
            member.wingName || "",
            member.flatNumber || "",
            member.memberType || "Owner",
            member.memberType?.toLowerCase() === "tenant" ? (member.ownerName || null) : null,
            member.gender || "",
            member.mobileNumber || "",
            member.email || "",
            member.vehicleType || null,
            member.vehicleNumber || null,
            'Pending',
            member.documents || null,
            member.roleType || "Society Member",
            1,
            0,
            0
          );

          createLog({
            action: "import",
            entityType: "member",
            entityId: Number(result.lastInsertRowid),
            entityName: member.name || "",
            actorUserId: actor.actorUserId,
            actorMemberId: actor.actorMemberId,
            actorName: actor.actorName,
            actorRole: actor.actorRole,
            societyId: memberSocietyId,
          });

          // WhatsApp Notification: ADD -> Notify Super Admin & Society Admin
          // WhatsApp Notification: ADD -> Notify Super Admin & Society Admin
          notifyWhatsApp("create", "member", {
            name: member.name || "",
            mobileNumber: member.mobileNumber || "",
            societyName: member.societyName || "",
            societyId: memberSocietyId
          });

          successfulImports++;
        } catch (e: any) {
          failedImports++;
          errors.push({ member: member, error: e.message });
          console.error("Failed to import member:", member, e);
        }
      }

      if (failedImports > 0) {
        return Response.json({
          success: false,
          message: `Successfully imported ${successfulImports} members, but ${failedImports} failed.`,
          errors: errors,
        }, { status: 207 }); // 207 Multi-Status
      } else {
        return Response.json({ success: true, message: `Successfully imported ${successfulImports} members.` });
      }
    }
  },

  /* 🔹 WINGS API 🔹 */

  "/api/wings": {
    async GET(req) {
      const role = req.headers.get("x-user-role");
      const societyId = req.headers.get("x-society-id");

      if (role === "Super Admin") {
        return Response.json(db.query("SELECT * FROM wings").all());
      }

      if (societyId) {
        return Response.json(db.query("SELECT * FROM wings WHERE societyId = ?").all(societyId));
      }
      return Response.json(db.query("SELECT * FROM wings").all());
    },
    async POST(req) {
      const { societyId, wingName, flats } = await req.json();
      const insert = db.prepare("INSERT INTO wings (societyId, wingName, flats) VALUES (?, ?, ?)");
      const result = insert.run(societyId, wingName, flats);
      const actor = getActorFromHeaders(req);
      createLog({
        action: "create",
        entityType: "wing",
        entityId: Number(result.lastInsertRowid),
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

      return Response.json({ id: result.lastInsertRowid, societyId, wingName, flats });
    },
  },

  "/api/wings/:id": {
    async PUT(req) {
      const id = req.params.id;
      const { wingName, flats } = await req.json();
      const actor = getActorFromHeaders(req);

      const existingWing = db.query("SELECT * FROM wings WHERE id = ?").get(id) as any;

      db.prepare("UPDATE wings SET wingName=?, flats=? WHERE id=?").run(wingName, flats, id);

      if (existingWing) {
        createLog({
          action: "update",
          entityType: "wing",
          entityId: Number(id),
          entityName: wingName || existingWing.wingName || "",
          actorUserId: actor.actorUserId,
          actorMemberId: actor.actorMemberId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          societyId: existingWing.societyId ? Number(existingWing.societyId) : actor.societyId,
        });

        notifyWhatsApp("update", "wing", {
          wingName: wingName || existingWing.wingName || "",
          societyId: existingWing.societyId ? Number(existingWing.societyId) : actor.societyId
        });
      }

      return Response.json({ success: true });
    },
    async DELETE(req) {
      const id = req.params.id;
      const actor = getActorFromHeaders(req);
      const existingWing = db.query("SELECT * FROM wings WHERE id = ?").get(id) as any;
      db.prepare("DELETE FROM wings WHERE id=?").run(id);
      if (existingWing) {
        createLog({
          action: "delete",
          entityType: "wing",
          entityId: Number(id),
          entityName: existingWing.wingName || "",
          actorUserId: actor.actorUserId,
          actorMemberId: actor.actorMemberId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          societyId: existingWing.societyId ? Number(existingWing.societyId) : actor.societyId,
        });

        notifyWhatsApp("delete", "wing", {
          wingName: existingWing.wingName || "",
          societyId: existingWing.societyId ? Number(existingWing.societyId) : actor.societyId
        });
      }
      return Response.json({ success: true });
    },
  },

  "/api/logs": {
    async GET(req) {
      const role = req.headers.get("x-user-role");
      const societyId = req.headers.get("x-society-id");
      const memberId = req.headers.get("x-member-id");

      let sql = "SELECT * FROM logs";
      const params: any[] = [];

      if (role !== "Super Admin" && role !== "admin") {
        if (role === "Society Admin" && societyId) {
          sql += " WHERE societyId = ?";
          params.push(societyId);
        } else if (role === "Member" && memberId) {
          sql += " WHERE actorMemberId = ? OR (entityType = 'member' AND entityId = ?)";
          params.push(memberId, memberId);
        } else {
          sql += " WHERE 1 = 0";
        }
      }

      sql += " ORDER BY id DESC";
      return Response.json(db.query(sql).all(...params));
    },
  },

  /* 🔹 STATS API 🔹 */
  "/api/stats": {
    async GET(req) {
      const role = req.headers.get("x-user-role");
      const societyId = req.headers.get("x-society-id");
      const memberId = req.headers.get("x-member-id");

      let societiesCount = 0;
      let membersCount = 0;
      let activeWings = 0;
      let totalFlats = 0;
      const recentMembersQuery = "SELECT * FROM members ORDER BY id DESC LIMIT 5";
      let recentMembers: any[] = [];

      if (role === "Super Admin" || role === "admin") {
        societiesCount = (db.query("SELECT COUNT(*) as count FROM societies").get() as any).count;
        membersCount = (db.query("SELECT COUNT(*) as count FROM members").get() as any).count;
        activeWings = (db.query("SELECT COUNT(*) as count FROM wings").get() as any).count || 0;
        totalFlats = membersCount;
        recentMembers = db.query(recentMembersQuery).all();
      } else if ((role === "Society Admin" || role === "Member") && societyId) {
        societiesCount = 1;
        membersCount = (db.query("SELECT COUNT(*) as count FROM members WHERE societyId = ?").get(societyId) as any).count;
        activeWings = (db.query("SELECT COUNT(*) as count FROM wings WHERE societyId = ?").get(societyId) as any).count || 0;
        totalFlats = membersCount;
        recentMembers = db.query("SELECT * FROM members WHERE societyId = ? ORDER BY id DESC LIMIT 5").all(societyId);
      }

      return Response.json({
        societiesCount,
        membersCount,
        activeWings,
        totalFlats,
        recentMembers,
      });
    }
  },

  /* 🔹 AUTH API 🔹 */
  "/api/login": {
    async POST(req) {
      const { email, password } = await req.json();
      const user = db.query(`
          SELECT u.*, u.societyId, u.memberId, r.name as roleName, r.permissions 
          FROM users u 
          LEFT JOIN roles r ON u.roleId = r.id 
          WHERE (u.email = ? OR u.username = ?) AND u.password = ?
        `).get(email, email, password) as any;
      if (user) {
        return Response.json({ success: true, user });
      } else {
        return Response.json({ success: false, message: "Invalid credentials" }, { status: 401 });
      }
    }
  },

  /* 🔹 ROLES API 🔹 */
  "/api/roles": {
    async GET(req) {
      return Response.json(db.query("SELECT * FROM roles").all());
    },
    async POST(req) {
      const { name, description, permissions, whatsappNumber, isWhatsApp } = await req.json();
      const insert = db.prepare("INSERT INTO roles (name, description, permissions, whatsappNumber, isWhatsApp) VALUES (?, ?, ?, ?, ?)");
      const res = insert.run(name, description, permissions, whatsappNumber || null, isWhatsApp ? 1 : 0);
      notifyWhatsApp("create", "role", { name });
      return Response.json({ id: res.lastInsertRowid, success: true });
    }
  },
  "/api/roles/:id": {
    async PUT(req) {
      const id = req.params.id;
      const { name, description, permissions, whatsappNumber, isWhatsApp } = await req.json();
      db.prepare("UPDATE roles SET name=?, description=?, permissions=?, whatsappNumber=?, isWhatsApp=? WHERE id=?").run(
        name, description, permissions, whatsappNumber || null, isWhatsApp ? 1 : 0, id
      );

      // Sync with Users table
      if (whatsappNumber) {
        db.prepare("UPDATE users SET mobileNumber = ? WHERE roleId = ?").run(whatsappNumber, id);
      }
      notifyWhatsApp("update", "role", { name });
      return Response.json({ success: true });
    },
    async DELETE(req) {
      const id = req.params.id;
      const actor = getActorFromHeaders(req);
      const existingRole = db.query("SELECT * FROM roles WHERE id=?").get(id) as any;
      db.prepare("DELETE FROM roles WHERE id=?").run(id);
      if (existingRole) {
        createLog({
          action: "delete",
          entityType: "role",
          entityId: Number(id),
          entityName: existingRole.name || "",
          actorUserId: actor.actorUserId,
          actorMemberId: actor.actorMemberId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          societyId: actor.societyId,
        });
        notifyWhatsApp("delete", "role", { name: existingRole.name || "" });
      }
      return Response.json({ success: true });
    }
  },

  /* 🔹 USERS API 🔹 */
  "/api/users": {
    async GET(req) {
      const role = req.headers.get("x-user-role");
      const societyId = req.headers.get("x-society-id");

      let sql = `
          SELECT u.id, u.fullName, u.email, u.status, u.roleId, u.societyId, u.memberId, u.mobileNumber,
                 r.name as roleName, s.name as societyName, m.name as memberName
          FROM users u 
          LEFT JOIN roles r ON u.roleId = r.id
          LEFT JOIN societies s ON u.societyId = s.id
          LEFT JOIN members m ON u.memberId = m.id
        `;
      let params: any[] = [];

      if (role === "Society Admin" && societyId) {
        sql += " WHERE u.societyId = ?";
        params.push(societyId);
      }

      sql += " ORDER BY u.id DESC";
      return Response.json(db.query(sql).all(...params));
    },
    async POST(req) {
      try {
        const { fullName, email, password, roleId, status, societyId, memberId, mobileNumber } = await req.json();
        // Use email as username since it's not provided in the form but might be required by DB schema
        const username = email;
        const insert = db.prepare("INSERT INTO users (fullName, email, username, password, roleId, status, societyId, memberId, mobileNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        const res = insert.run(fullName, email, username, password, roleId, status, societyId || null, memberId || null, mobileNumber || null);

        const actor = getActorFromHeaders(req);
        createLog({
          action: "create",
          entityType: "user",
          entityId: Number(res.lastInsertRowid),
          entityName: fullName || email,
          actorUserId: actor.actorUserId,
          actorMemberId: actor.actorMemberId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          societyId: societyId ? Number(societyId) : actor.societyId,
        });

        notifyWhatsApp("create", "user", {
          fullName: fullName || email,
          email,
          societyId: societyId ? Number(societyId) : actor.societyId
        });

        return Response.json({ id: res.lastInsertRowid, success: true });
      } catch (e: any) {
        console.error("Error creating user:", e);
        if (e.message && e.message.includes("UNIQUE constraint failed")) {
          return Response.json({ success: false, message: "Email already exists" }, { status: 400 });
        }
        return Response.json({ success: false, message: "Failed to create user", error: e.message }, { status: 500 });
      }
    }
  },
  "/api/users/:id": {
    async PUT(req) {
      try {
        const id = req.params.id;
        const { fullName, email, roleId, status, societyId, memberId, password, mobileNumber } = await req.json();
        const username = email; // Keep username in sync with email
        if (password && password.length > 0) {
          db.prepare("UPDATE users SET fullName=?, email=?, username=?, roleId=?, status=?, societyId=?, memberId=?, password=?, mobileNumber=? WHERE id=?")
            .run(fullName, email, username, roleId, status, societyId || null, memberId || null, password, mobileNumber || null, id);
        } else {
          db.prepare("UPDATE users SET fullName=?, email=?, username=?, roleId=?, status=?, societyId=?, memberId=?, mobileNumber=? WHERE id=?")
            .run(fullName, email, username, roleId, status, societyId || null, memberId || null, mobileNumber || null, id);
        }

        const actor = getActorFromHeaders(req);
        createLog({
          action: "update",
          entityType: "user",
          entityId: Number(id),
          entityName: fullName || email,
          actorUserId: actor.actorUserId,
          actorMemberId: actor.actorMemberId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          societyId: societyId ? Number(societyId) : actor.societyId,
        });

        notifyWhatsApp("update", "user", {
          fullName: fullName || email,
          societyId: societyId ? Number(societyId) : actor.societyId
        });

        return Response.json({ success: true });
      } catch (e: any) {
        console.error("Error updating user:", e);
        if (e.message && e.message.includes("UNIQUE constraint failed")) {
          return Response.json({ success: false, message: "Email already exists" }, { status: 400 });
        }
        return Response.json({ success: false, message: "Failed to update user", error: e.message }, { status: 500 });
      }
    },
    async DELETE(req) {
      const id = req.params.id;
      const actor = getActorFromHeaders(req);
      const existingUser = db.query("SELECT * FROM users WHERE id=?").get(id) as any;
      db.prepare("DELETE FROM users WHERE id=?").run(id);
      if (existingUser) {
        createLog({
          action: "delete",
          entityType: "user",
          entityId: Number(id),
          entityName: existingUser.fullName || existingUser.email || "",
          actorUserId: actor.actorUserId,
          actorMemberId: actor.actorMemberId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          societyId: existingUser.societyId ? Number(existingUser.societyId) : actor.societyId,
        });

        notifyWhatsApp("delete", "user", {
          fullName: existingUser.fullName || existingUser.email,
          societyId: existingUser.societyId ? Number(existingUser.societyId) : actor.societyId
        });
      }
      return Response.json({ success: true });
    }
  }
};

const server = serve({
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  hostname: "0.0.0.0",
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
  async fetch(req) {
    const url = new URL(req.url);
    console.log(`[${req.method}] ${url.pathname}`);

    // Helper to match routes with parameters
    const matchRoute = (pattern: string, path: string) => {
      if (pattern === path) return {};

      const patternParts = pattern.split("/");
      const pathParts = path.split("/");
      if (patternParts.length !== pathParts.length) return null;

      const params: Record<string, string> = {};
      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(":")) {
          params[patternParts[i].substring(1)] = pathParts[i];
        } else if (patternParts[i] !== pathParts[i]) {
          return null;
        }
      }
      return params;
    };

    // Iterate through defined routes
    for (const pattern in routes) {
      const params = matchRoute(pattern, url.pathname);
      if (params) {
        const routeHandler = (routes as any)[pattern][req.method];
        if (routeHandler) {
          // Attach params to req for compatibility
          (req as any).params = params;
          return routeHandler(req, params);
        }
      }
    }

    // If no route matched
    if (url.pathname.startsWith("/api/")) {
      // If it's an API route but no handler was found, return JSON 404
      console.log(`API Not Found: ${url.pathname}`);
      return Response.json({ success: false, message: "API Endpoint Not Found" }, { status: 404 });
    }

    // Fallback for SPA (serve index.html for non-API routes)
    const filePath = `./dist${url.pathname === "/" ? "/index.html" : url.pathname}`;
    if (existsSync(filePath)) {
      console.log(`Serving static file: ${filePath}`);
      return new Response(Bun.file(filePath));
    }

    // If it's not an API route and not a file, serve index.html (SPA fallback)
    console.log(`SPA Fallback: Serving index.html for ${url.pathname}`);
    const file = Bun.file("./dist/index.html");
    const text = await file.text();
    const timestamp = Date.now();
    const modified = text
      .replace(/src="([^"]+\.js)"/g, `src="$1?v=${timestamp}"`)
      .replace(/href="([^"]+\.css)"/g, `href="$1?v=${timestamp}"`);

    return new Response(modified, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    });
  },
});

console.log(`🚀 Server running at ${server.url}`);
console.log(`🔗 Network access enabled. Use your computer's IP address to access from other devices.`);
