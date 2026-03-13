import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Wing extends Model {
  declare id: number;
  declare societyId: number;
  declare wingName: string;
  declare flats: string;

  // timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Wing.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    societyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    wingName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    flats: {
      type: DataTypes.TEXT, // Store as JSON string or comma separated
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'wings',
    timestamps: true,
  }
);
