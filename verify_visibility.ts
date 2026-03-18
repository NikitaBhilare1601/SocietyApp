import { Database } from "bun:sqlite";

const db = new Database("backend/database/society.db");

console.log("--- USERS ---");
const users = db.query("SELECT id, email, societyId FROM users").all() as any[];
users.forEach(u => console.log(`User: ${u.email} | SocID: ${u.societyId}`));

console.log("\n--- SOCIETIES ---");
const socs = db.query("SELECT id, name FROM societies").all() as any[];
socs.forEach(s => console.log(`Soc: ${s.id} | ${s.name}`));

console.log("\n--- MEMBERS BY SOCIETY ---");
const counts = db.query("SELECT societyId, COUNT(*) as c FROM members GROUP BY societyId").all() as any[];
counts.forEach(c => console.log(`SocID: ${c.societyId} | Members: ${c.c}`));

console.log("\n--- RECENT MEMBERS ---");
const members = db.query("SELECT id, name, societyId, status FROM members ORDER BY id DESC LIMIT 10").all() as any[];
members.forEach(m => console.log(`Member: ${m.name} | SocID: ${m.societyId} | Status: ${m.status}`));

db.close();
