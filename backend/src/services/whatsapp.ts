import { User, Role, Society } from "../models";

/**
 * 🔹 PROVIDER INTEGRATION 🔹
 * Sends a WhatsApp message using the configured provider (Twilio or Meta).
 */
export const sendWhatsAppMessage = async (to: string, message: string): Promise<boolean> => {
  const provider = process.env.WHATSAPP_PROVIDER || "console"; // Default to console if not set

  if (!to) {
    console.warn("⚠️ No recipient number provided for WhatsApp notification.");
    return false;
  }

  // Ensure number format (basic cleanup)
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
        return true;
      }
    } else {
      // Console mock
      return true;
    }
  } catch (err) {
    console.error("❌ Failed to send WhatsApp message:", err);
    return false;
  }
};

/**
 * 🔹 WHATSAPP NOTIFICATION HELPER 🔹
 */
export const notifyWhatsApp = async (
  action: "create" | "update" | "delete" | "add" | "edit" | "approve" | "import",
  entityType: "member" | "society" | "wing" | "role" | "user",
  data: any
) => {
  console.log(`🚀 [WhatsApp Trigger] Action: ${action}, Entity: ${entityType}`, data);
  try {
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

    let superAdminNumber: string | undefined;
    
    const superAdminUser = await User.findOne({
      include: [{ model: Role, as: 'role', where: { name: 'Super Admin' } }]
    });

    if (superAdminUser?.mobileNumber) {
      superAdminNumber = superAdminUser.mobileNumber;
    }

    let societyNotificationNumber: string | undefined;
    if (societyId) {
      const societyAdminUser = await User.findOne({
        where: { societyId },
        include: [{ model: Role, as: 'role', where: { name: 'Society Admin' } }]
      });

      if (societyAdminUser?.mobileNumber) {
        societyNotificationNumber = societyAdminUser.mobileNumber;
      } else {
        const society = await Society.findByPk(societyId);
        if (society?.whatsappNumber && society.isWhatsApp) {
          societyNotificationNumber = society.whatsappNumber;
        }
      }
    }

    if (superAdminNumber) {
      await sendWhatsAppMessage(superAdminNumber, message);
    }

    if (societyNotificationNumber) {
      const normalize = (num: string) => num.replace(/\D/g, '').slice(-10);
      if (!(superAdminNumber && normalize(societyNotificationNumber) === normalize(superAdminNumber))) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await sendWhatsAppMessage(societyNotificationNumber, message);
      }
    }

  } catch (error) {
    console.error("WhatsApp notification failed:", error);
  }
};
