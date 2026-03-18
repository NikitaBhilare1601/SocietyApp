import { Database } from "bun:sqlite";
import { statSync } from "fs";

const paths = [
  "backend/database/society.db",
  "backend/src/db/society.db",
  "database/society.db"
];

for (const p of paths) {
  try {
    const db = new Database(p);
    const m = db.query("SELECT COUNT(*) as c FROM members").get() as any;
    const u = db.query("SELECT COUNT(*) as c FROM users").get() as any;
    const l = db.query("SELECT COUNT(*) as c FROM logs WHERE action='import'").get() as any;
    console.log(`[DB] ${p} | M:${m.c} | U:${u.c} | L:${l.c}`);
    db.close();
  } catch (e) {
    console.log(`[DB] ${p} | ERROR`);
  }
}
