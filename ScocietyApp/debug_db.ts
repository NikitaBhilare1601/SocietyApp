import db from './src/db.ts';
import fs from 'fs';

let output = '';

output += '--- SOCIETIES ---\n';
const societies = db.query('SELECT id, name, whatsappNumber, isWhatsApp FROM societies').all();
output += JSON.stringify(societies, null, 2) + '\n';

output += '\n--- USERS (Admins) ---\n';
const users = db.query(`
  SELECT u.id, u.fullName, u.email, u.mobileNumber, r.name as roleName, u.societyId 
  FROM users u 
  JOIN roles r ON u.roleId = r.id 
  WHERE r.name IN ('Super Admin', 'Society Admin')
`).all();
output += JSON.stringify(users, null, 2) + '\n';

output += '\n--- ROLES ---\n';
const roles = db.query('SELECT id, name, whatsappNumber, isWhatsApp FROM roles').all();
output += JSON.stringify(roles, null, 2) + '\n';

fs.writeFileSync('db_debug_output.txt', output);
console.log('Output written to db_debug_output.txt');
