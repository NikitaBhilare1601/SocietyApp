import { db } from './connection';
import { societies, wings, members, roles, users, menus, roleMenuMappings } from './schema';

async function seedDatabase() {
  // Seed roles
  const roleData = [
    { name: 'Super Admin' },
    { name: 'Society Admin' },
    { name: 'Member' },
  ];
  await db.insert(roles).values(roleData);

  // Seed societies
  const societyData = [
    { name: 'Green Valley', numberOfWings: 3 },
    { name: 'Blue Heights', numberOfWings: 2 },
  ];
  await db.insert(societies).values(societyData);

  // Seed wings
  const wingData = [
    { name: 'A Wing', societyId: 1, totalFlats: 10 },
    { name: 'B Wing', societyId: 1, totalFlats: 8 },
    { name: 'C Wing', societyId: 2, totalFlats: 12 },
  ];
  await db.insert(wings).values(wingData);

  // Seed members
  const memberData = [
    {
      societyId: 1,
      wingId: 1,
      flatNumber: '101',
      memberType: 'Owner',
      gender: 'Male',
      mobileNumber: '9876543210',
      email: 'owner1@example.com',
    },
    {
      societyId: 1,
      wingId: 2,
      flatNumber: '202',
      memberType: 'Tenant',
      ownerName: 'Owner 2',
      gender: 'Female',
      mobileNumber: '9876543211',
      email: 'tenant1@example.com',
    },
  ];
  await db.insert(members).values(memberData);

  // Seed menus
  const menuData = [
    { name: 'Dashboard', visibility: 'All' },
    { name: 'Society Management', visibility: 'Super Admin' },
    { name: 'Member Management', visibility: 'Society Admin' },
  ];
  await db.insert(menus).values(menuData);

  // Seed role-menu mappings
  const roleMenuData = [
    { roleId: 1, menuId: 1 },
    { roleId: 1, menuId: 2 },
    { roleId: 2, menuId: 3 },
  ];
  await db.insert(roleMenuMappings).values(roleMenuData);

  console.log('Database seeded successfully!');
}

seedDatabase().catch((error) => {
  console.error('Error seeding database:', error);
});