import { Database } from "bun:sqlite";
import fs from "fs";

const db = new Database("backend/database/society.db");
const schema = db.query("PRAGMA table_info(users)").all();
const columns = schema.map((c: any) => c.name);

const users = db.query("SELECT * FROM users").all() as any[];

let output = `COLUMNS: ${columns.join(", ")}\n`;
users.forEach(u => {
    output += `USER: ${u.id} | ${u.email} | SOC: ${u.societyId} | ROLE: ${u.roleId} | NAME: ${u.fullName}\n`;
});

fs.writeFileSync("schema_results.txt", output);
db.close();
