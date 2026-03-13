import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class User extends Model {
  declare id: number;
  declare fullName?: string;
  declare email: string;
  declare username?: string;
  declare password?: string;
  declare roleId?: number;
  declare societyId?: number;
  declare memberId?: number;
  declare mobileNumber?: string;
  declare status: string;
  
  declare readonly createdAt: Date;
  // Note: the original table only had created_at, but Sequelize uses createdAt and updatedAt by default.
  // We'll map createdAt to created_at and disable updatedAt.
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true, // Some rows might not have it strictly required in sqlite but good practice
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    societyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    memberId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Active',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: false, // We manually handled createdAt and no updatedAt required
  }
);
