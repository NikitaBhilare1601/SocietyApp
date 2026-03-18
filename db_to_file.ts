import { Database } from "bun:sqlite";
import fs from "fs";

const paths = [
  "backend/database/society.db",
  "backend/src/db/society.db",
  "database/society.db"
];

let output = "";

for (const p of paths) {
  try {
    const db = new Database(p);
    const m = db.query("SELECT COUNT(*) as c FROM members").get() as any;
    const u = db.query("SELECT COUNT(*) as c FROM users").get() as any;
    const l = db.query("SELECT COUNT(*) as c FROM logs WHERE action='import'").get() as any;
    output += `[DB] ${p}\n  MEMBERS: ${m.c}\n  USERS: ${u.c}\n  IMPORT_LOGS: ${l.c}\n`;
    
    // Check for any members at all
    const someMembers = db.query("SELECT id, name, status, societyId FROM members LIMIT 5").all() as any[];
    someMembers.forEach(sm => {
        output += `    - ${sm.id}: ${sm.name} | ${sm.status} | Soc: ${sm.societyId}\n`;
    });

    db.close();
  } catch (e: any) {
    output += `[DB] ${p} | ERROR: ${e.message}\n`;
  }
}

fs.writeFileSync("db_results.txt", output);
console.log("Results written to db_results.txt");
