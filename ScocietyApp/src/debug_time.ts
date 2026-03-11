import { Database } from "bun:sqlite";

const db = new Database("society.db");

// 1. Check system time
console.log("System Time (JS Date):", new Date().toString());
console.log("System Time (ISO):", new Date().toISOString());

// 2. Check SQLite time
const dbTime = db.query("SELECT CURRENT_TIMESTAMP as ct, datetime('now') as dt, datetime('now', 'localtime') as lt").get();
console.log("DB Time (CURRENT_TIMESTAMP):", (dbTime as any).ct);
console.log("DB Time (datetime('now')):", (dbTime as any).dt);
console.log("DB Time (datetime('now', 'localtime')):", (dbTime as any).lt);

// 3. Insert a log and check stored value
db.run("INSERT INTO logs (action, entityType, entityName) VALUES ('TEST_TIME', 'debug', 'Debug Time')");
const lastLog = db.query("SELECT * FROM logs WHERE action = 'TEST_TIME' ORDER BY id DESC LIMIT 1").get();
console.log("Stored Log Time:", (lastLog as any).created_at);

// Clean up
db.run("DELETE FROM logs WHERE action = 'TEST_TIME'");