import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Society extends Model {
  declare id: number;
  declare name: string;
  declare numberOfWings: number;
  declare whatsappNumber?: string;
  declare isWhatsApp: boolean;

  // timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Society.init(
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
    numberOfWings: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    tableName: 'societies',
    timestamps: true,
  }
);
