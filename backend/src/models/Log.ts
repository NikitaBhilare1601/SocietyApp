import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Log extends Model {
  declare id: number;
  declare action: string;
  declare entityType: string;
  declare entityId?: number;
  declare entityName?: string;
  declare actorUserId?: number;
  declare actorName?: string;
  declare actorRole?: string;
  declare societyId?: number;
  declare actorMemberId?: number;
  declare readonly createdAt: Date;
}

Log.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    entityName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    actorUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    actorName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    actorRole: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    societyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    actorMemberId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'logs',
    timestamps: false,
  }
);
