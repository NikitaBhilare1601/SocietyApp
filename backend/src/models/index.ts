import { sequelize } from '../config/database';

import { Society } from './Society';
import { Wing } from './Wing';
import { Member } from './Member';
import { Role } from './Role';
import { User } from './User';
import { Log } from './Log';

// Define associations
Society.hasMany(Wing, { foreignKey: 'societyId', as: 'wings' });
Wing.belongsTo(Society, { foreignKey: 'societyId', as: 'society' });

Society.hasMany(Member, { foreignKey: 'societyId', as: 'members' });
Member.belongsTo(Society, { foreignKey: 'societyId', as: 'society' });

Wing.hasMany(Member, { foreignKey: 'wingName', sourceKey: 'wingName', as: 'members', constraints: false });
Member.belongsTo(Wing, { foreignKey: 'wingName', targetKey: 'wingName', as: 'wing', constraints: false });

Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

Society.hasMany(User, { foreignKey: 'societyId', as: 'users' });
User.belongsTo(Society, { foreignKey: 'societyId', as: 'society' });

Member.hasMany(User, { foreignKey: 'memberId', as: 'users' });
User.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

export {
  sequelize,
  Society,
  Wing,
  Member,
  Role,
  User,
  Log,
};
