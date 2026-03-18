const fs = require('fs');
const dbs = [
  'backend/database/society.db',
  'backend/src/db/society.db',
  'database/society.db'
];

dbs.forEach(db => {
  try {
    const stats = fs.statSync(db);
    console.log(`${db}: ${stats.size} bytes, modified: ${stats.mtime}`);
  } catch (e) {
    console.log(`${db}: NOT FOUND`);
  }
});
