import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Role extends Model {
  declare id: number;
  declare name: string;
  declare description?: string;
  declare permissions?: string;
  declare whatsappNumber?: string;
  declare isWhatsApp: boolean;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    permissions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    whatsappNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isWhatsApp: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'roles',
    timestamps: false,
  }
);
