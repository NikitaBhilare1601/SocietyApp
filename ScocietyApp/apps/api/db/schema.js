import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

// Society Table
export const societies = sqliteTable('societies', {
  id: integer('id').primaryKey().autoIncrement(),
  name: text('name').notNull(),
  numberOfWings: integer('number_of_wings').notNull(),
});

// Wing Table
export const wings = sqliteTable('wings', {
  id: integer('id').primaryKey().autoIncrement(),
  name: text('name').notNull(),
  societyId: integer('society_id').references(() => societies.id),
  totalFlats: integer('total_flats').notNull(),
});

// Member Table
export const members = sqliteTable('members', {
  id: integer('id').primaryKey().autoIncrement(),
  name: text('name').notNull(), // Member Name
  societyId: integer('society_id').references(() => societies.id),
  wingId: integer('wing_id').references(() => wings.id),
  wingName: text('wing_name'),
  societyName: text('society_name'),
  flatNumber: text('flat_number').notNull(),
  memberType: text('member_type').notNull(), // Owner or Tenant
  ownerName: text('owner_name'), // Required if Tenant
  vehicleType: text('vehicle_type'),
  vehicleNumber: text('vehicle_number'),
  gender: text('gender').notNull(),
  mobileNumber: text('mobile_number').notNull(),
  email: text('email').notNull(),
  idProof: text('id_proof'),
});

// Role Table
export const roles = sqliteTable('roles', {
  id: integer('id').primaryKey().autoIncrement(),
  name: text('name').notNull(),
});

// User Table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey().autoIncrement(),
  username: text('username').notNull(),
  password: text('password').notNull(),
  roleId: integer('role_id').references(() => roles.id),
  status: text('status').notNull(), // Active or Inactive
});

// Menu Table
export const menus = sqliteTable('menus', {
  id: integer('id').primaryKey().autoIncrement(),
  name: text('name').notNull(),
  visibility: text('visibility').notNull(),
});

// Role-Menu Mapping Table
export const roleMenuMappings = sqliteTable(
  'role_menu_mappings',
  {
    roleId: integer('role_id').references(() => roles.id),
    menuId: integer('menu_id').references(() => menus.id),
  },
  (table) => ({
    pk: primaryKey(table.roleId, table.menuId),
  })
);