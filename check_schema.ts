import { sequelize } from './backend/src/models';

async function checkSchema() {
  try {
    const [results] = await sequelize.query("PRAGMA table_info(users)");
    // @ts-ignore
    results.forEach(r => console.log("COL:", r.name));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkSchema();
