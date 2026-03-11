import db from './src/db.ts';

const previousNumber = '8554876505';

console.log(`Reverting Society Admin phone number to: ${previousNumber}`);

// 1. Update users table for Society Admin role
const updateUsers = db.prepare(`
  UPDATE users 
  SET mobileNumber = ? 
  WHERE roleId IN (SELECT id FROM roles WHERE name = 'Society Admin')
`);
updateUsers.run(previousNumber);

// 2. Update roles table for Society Admin fallback
const updateRoles = db.prepare(`
  UPDATE roles 
  SET whatsappNumber = ?, isWhatsApp = 1 
  WHERE name = 'Society Admin'
`);
updateRoles.run(previousNumber);

console.log('Revert completed.');
