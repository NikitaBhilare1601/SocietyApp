import { Database } from "bun:sqlite";
import { statSync } from "fs";
import path from "path";

const dbs = [
  'backend/database/society.db',
  'backend/src/db/society.db',
  'database/society.db'
];

dbs.forEach(dbPath => {
  console.log(`\nTARGET: ${dbPath}`);
  try {
    const stats = statSync(dbPath);
    console.log(`SIZE: ${stats.size} bytes`);
    console.log(`DATE: ${stats.mtime}`);

    const db = new Database(dbPath);
    const mCount = db.query("SELECT COUNT(*) as count FROM members").get() as any;
    console.log(`MEMBERS: ${mCount?.count}`);

    const uCount = db.query("SELECT COUNT(*) as count FROM users").get() as any;
    console.log(`USERS: ${uCount?.count}`);

    const users = db.query("SELECT id, fullName, email, societyId, roleId FROM users LIMIT 3").all() as any[];
    users.forEach(u => console.log(`  USER: ${u.id} | ${u.email} | SOC: ${u.societyId} | ROLE: ${u.roleId}`));

    const logs = db.query("SELECT COUNT(*) as count FROM logs WHERE action IN ('import', 'bulk_create')").get() as any;
    console.log(`IMPORT_LOGS: ${logs?.count}`);

    db.close();
  } catch (e: any) {
    console.log(`ERROR: ${e.message}`);
  }
});
