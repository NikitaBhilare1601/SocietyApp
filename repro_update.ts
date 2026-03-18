import { User, Role, Society, Member, Log, sequelize } from './backend/src/models';

async function testUpdate() {
  try {
    await sequelize.authenticate();
    console.log('DB Connected');

    const id = 1; // Assuming admin user is 1
    const existingUser = await User.findByPk(id);
    if (!existingUser) {
      console.log('User not found');
      return;
    }

    const updateData = {
      fullName: "Admin Edited",
      email: "admin@society.com",
      username: "admin@society.com",
      roleId: 1,
      status: "Active",
      societyId: null,
      memberId: null,
      mobileNumber: "919876543210",
      address: ""
    };

    console.log('Updating user...');
    await existingUser.update(updateData);
    console.log('Update successful');

    process.exit(0);
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
}

testUpdate();
