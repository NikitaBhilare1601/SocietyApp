import { Database } from "bun:sqlite";
import path from "path";

const dbs = [
  'backend/database/society.db',
  'backend/src/db/society.db',
  'database/society.db'
];

async function checkDbs() {
  for (const dbPath of dbs) {
    console.log(`\nDB_PATH: ${dbPath}`);
    try {
      const absolutePath = path.resolve(process.cwd(), dbPath);
      const db = new Database(absolutePath);
      
      const countResult = db.query("SELECT COUNT(*) as count FROM members").get() as any;
      console.log(`MEMBERS_COUNT: ${countResult?.count}`);

      const recentLogs = db.query("SELECT id, action, entityName FROM logs WHERE action IN ('import', 'bulk_create') ORDER BY id DESC LIMIT 5").all() as any[];
      console.log(`IMPORT_LOGS_COUNT: ${recentLogs.length}`);
      recentLogs.forEach(l => console.log(`  LOG: ${l.id} | ${l.action} | ${l.entityName}`));
      
      db.close();
    } catch (e: any) {
      console.log(`ERROR: ${e.message}`);
    }
  }
}

checkDbs();
