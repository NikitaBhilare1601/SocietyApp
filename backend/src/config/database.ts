import { Sequelize } from 'sequelize';
import path from 'path';

// Define the absolute path to the database file
const dbPath = path.join(import.meta.dirname, '../../database/society.db');

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

// Optionally export a connect function
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite Connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};
