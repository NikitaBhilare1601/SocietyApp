import { existsSync, mkdirSync } from "fs";
import path from "path";
import { config } from "../../../config/env";

export const UploadController = {
  async upload(req: any) {
    try {
      const contentType = req.headers.get("content-type") || "";
      if (!contentType.includes("multipart/form-data")) {
        return Response.json({ success: false, message: "Invalid content type" }, { status: 400 });
      }

      const formData = await req.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return Response.json({ success: false, message: "No file uploaded" }, { status: 400 });
      }

      const ext = file.name.split(".").pop()?.toLowerCase();
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
      const uploadPath = path.join(config.uploadsDir, filename);

      // Ensure uploads directory exists
      if (!existsSync(config.uploadsDir)) {
        mkdirSync(config.uploadsDir, { recursive: true });
      }

      const buffer = await file.arrayBuffer();
      await Bun.write(uploadPath, buffer);

      const fileUrl = `/uploads/${filename}`;
      return Response.json({ success: true, url: fileUrl });
    } catch (error: any) {
      console.error("Upload error:", error);
      return Response.json({ success: false, message: "Upload failed" }, { status: 500 });
    }
  }
};
