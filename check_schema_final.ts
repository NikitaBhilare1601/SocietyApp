import { Database } from "bun:sqlite";

const db = new Database("backend/database/society.db");
const schema = db.query("PRAGMA table_info(users)").all();
console.log(JSON.stringify(schema, null, 2));

const user = db.query("SELECT * FROM users LIMIT 1").get();
console.log("User Row:", JSON.stringify(user, null, 2));

db.close();
