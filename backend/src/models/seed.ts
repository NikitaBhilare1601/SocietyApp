import { Role, User, Society } from './index';

export const seedDatabase = async () => {
  try {
    const roleCount = await Role.count();
    if (roleCount === 0) {
      console.log("🌱 Seeding roles...");
      await Role.bulkCreate([
        {
          name: 'Super Admin',
          description: 'Full system access',
          permissions: 'all',
          isWhatsApp: false
        },
        {
          name: 'Society Admin',
          description: 'Access to own society',
          permissions: 'societies:edit,members:edit,reports:view,dashboard:view,settings:edit,logs:view',
          isWhatsApp: false
        },
        {
          name: 'Member',
          description: 'Limited access',
          permissions: 'dashboard:view,logs:view',
          isWhatsApp: false
        }
      ]);
      console.log("✅ Roles seeded.");
    }

    const userCount = await User.count();
    if (userCount === 0) {
      console.log("🌱 Seeding default users...");
      const roles = await Role.findAll();
      const superAdminRole = roles.find(r => r.name === 'Super Admin');
      const societyAdminRole = roles.find(r => r.name === 'Society Admin');
      const memberRole = roles.find(r => r.name === 'Member');

      // Create a default society if none exists
      let defaultSoc = await Society.findOne();
      if (!defaultSoc) {
        defaultSoc = await Society.create({
          name: 'Demo Society',
          numberOfWings: 0,
          isWhatsApp: false
        });
      }

      await User.bulkCreate([
        {
          fullName: 'Administrator',
          email: 'admin@society.com',
          username: 'admin',
          password: 'admin123',
          roleId: superAdminRole?.id,
          status: 'Active',
          mobileNumber: '919876543210'
        },
        {
          fullName: 'Society Secretary',
          email: 'secretary@society.com',
          username: 'secretary',
          password: 'sec123',
          roleId: societyAdminRole?.id,
          status: 'Active',
          societyId: defaultSoc.id,
          mobileNumber: '919876543211'
        }
      ]);
      console.log("✅ Users seeded.");
    }
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
};
