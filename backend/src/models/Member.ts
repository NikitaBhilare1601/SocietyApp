import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Member extends Model {
  declare id: number;
  declare name: string;
  declare societyId: number;
  declare societyName: string;
  declare wingName: string;
  declare flatNumber: string;
  declare memberType: string;
  declare ownerName?: string;
  declare gender: string;
  declare mobileNumber: string;
  declare email?: string;
  declare vehicleType?: string;
  declare vehicleNumber?: string;
  declare status: string;
  declare documents?: string;
  declare roleType: string;
  declare canRead: boolean;
  declare canEdit: boolean;
  declare canDelete: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Member.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    societyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    societyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    wingName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    flatNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    memberType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ownerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vehicleType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vehicleNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Pending',
    },
    documents: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    roleType: {
      type: DataTypes.STRING,
      defaultValue: 'Society Member',
    },
    canRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    canEdit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canDelete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'members',
    timestamps: true,
  }
);
