import db from './src/db.ts';

const newNumber = '9922488019';

console.log(`Updating Society Admin phone number to: ${newNumber}`);

// 1. Update users table for Society Admin role
const updateUsers = db.prepare(`
  UPDATE users 
  SET mobileNumber = ? 
  WHERE roleId IN (SELECT id FROM roles WHERE name = 'Society Admin')
`);
const userResult = updateUsers.run(newNumber);
console.log(`Users table updated. Rows affected: ${userResult.changes}`);

// 2. Update roles table for Society Admin fallback
const updateRoles = db.prepare(`
  UPDATE roles 
  SET whatsappNumber = ?, isWhatsApp = 1 
  WHERE name = 'Society Admin'
`);
const roleResult = updateRoles.run(newNumber);
console.log(`Roles table updated. Rows affected: ${roleResult.changes}`);

console.log('Update completed binary.');
