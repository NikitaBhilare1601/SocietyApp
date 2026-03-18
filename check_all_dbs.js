const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbs = [
  'backend/database/society.db',
  'backend/src/db/society.db',
  'database/society.db'
];

async function checkDbs() {
  for (const dbPath of dbs) {
    console.log(`\n--- Checking: ${dbPath} ---`);
    const absolutePath = path.resolve(process.cwd(), dbPath);
    
    const db = new sqlite3.Database(absolutePath, sqlite3.OPEN_READONLY);
    
    await new Promise((resolve) => {
      db.get("SELECT COUNT(*) as count FROM members", (err, row) => {
        if (err) {
          console.log(`Members table error: ${err.message}`);
        } else {
          console.log(`TOTAL_MEMBERS: ${row.count}`);
        }
        resolve();
      });
    });

    await new Promise((resolve) => {
      db.all("SELECT id, name, societyId, created_at FROM members ORDER BY id DESC LIMIT 2", (err, rows) => {
        if (!err && rows.length > 0) {
          console.log('Last 2 members:');
          rows.forEach(r => console.log(`  ID: ${r.id}, Name: ${r.name}, Society: ${r.societyId}, Created: ${r.created_at}`));
        }
        resolve();
      });
    });
    
    await new Promise((resolve) => {
      db.all("SELECT id, action, entityName, created_at FROM logs WHERE action IN ('import', 'bulk_create') ORDER BY id DESC LIMIT 2", (err, rows) => {
        if (!err && rows.length > 0) {
          console.log('Recent import logs:');
          rows.forEach(r => console.log(`  LogID: ${r.id}, Action: ${r.action}, Name: ${r.entityName}, Created: ${r.created_at}`));
        } else if (err) {
             console.log(`Logs table error: ${err.message}`);
        }
        resolve();
      });
    });

    db.close();
  }
}

checkDbs();
