import { Database } from "bun:sqlite";

const db = new Database("society.db");

// Initialize tables
db.run(`
  CREATE TABLE IF NOT EXISTS societies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    numberOfWings INTEGER NOT NULL,
    whatsappNumber TEXT,
    isWhatsApp INTEGER DEFAULT 0
  )
`);

try {
  db.run("ALTER TABLE societies ADD COLUMN isWhatsApp INTEGER DEFAULT 0");
} catch (e) { }

db.run(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    societyId INTEGER NOT NULL,
    societyName TEXT NOT NULL,
    wingName TEXT NOT NULL,
    flatNumber TEXT NOT NULL,
    memberType TEXT NOT NULL,
    ownerName TEXT,
    gender TEXT NOT NULL,
    mobileNumber TEXT NOT NULL,
    email TEXT,
    vehicleType TEXT,
    vehicleNumber TEXT,
    status TEXT DEFAULT 'Pending',
    documents TEXT,
    roleType TEXT DEFAULT 'Society Member',
    canRead INTEGER DEFAULT 1,
    canEdit INTEGER DEFAULT 0,
    canDelete INTEGER DEFAULT 0,
    FOREIGN KEY(societyId) REFERENCES societies(id)
  )
`);

// Migration to add columns if they don't exist
try {
  db.run("ALTER TABLE members ADD COLUMN roleType TEXT DEFAULT 'Society Member'");
} catch (e) {
  // Column likely exists
}
try {
  db.run("ALTER TABLE members ADD COLUMN status TEXT DEFAULT 'Pending'");
} catch (e) {
  // Column likely exists
}
try {
  db.run("ALTER TABLE members ADD COLUMN documents TEXT");
} catch (e) {
  // Column likely exists
}
try {
  db.run("ALTER TABLE members ADD COLUMN canRead INTEGER DEFAULT 1");
} catch (e) {
  // Column likely exists
}
try {
  db.run("ALTER TABLE members ADD COLUMN canEdit INTEGER DEFAULT 0");
} catch (e) {
  // Column likely exists
}
try {
  db.run("ALTER TABLE members ADD COLUMN canDelete INTEGER DEFAULT 0");
} catch (e) {
  // Column likely exists
}

try {
  db.run("ALTER TABLE users ADD COLUMN mobileNumber TEXT");
} catch (e) {
  // Column likely exists
}

try {
  db.run("ALTER TABLE societies ADD COLUMN whatsappNumber TEXT");
} catch (e) {
  // Column likely exists
}

try {
  db.run("ALTER TABLE logs ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
} catch (e) {
  // Column likely exists
}

db.run("UPDATE members SET canRead = 1 WHERE canRead IS NULL");
db.run("UPDATE members SET canEdit = 0 WHERE canEdit IS NULL");
db.run("UPDATE members SET canDelete = 0 WHERE canDelete IS NULL");

db.run(`
  CREATE TABLE IF NOT EXISTS wings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    societyId INTEGER NOT NULL,
    wingName TEXT NOT NULL,
    flats TEXT NOT NULL,
    FOREIGN KEY(societyId) REFERENCES societies(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    entityType TEXT NOT NULL,
    entityId INTEGER,
    entityName TEXT,
    actorUserId INTEGER,
    actorName TEXT,
    actorRole TEXT,
    societyId INTEGER,
    actorMemberId INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;

// Roles Table
db.run(`
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT,
    whatsappNumber TEXT,
    isWhatsApp INTEGER DEFAULT 0
  )
`);

try {
  db.run("ALTER TABLE roles ADD COLUMN whatsappNumber TEXT");
} catch (e) { }

try {
  db.run("ALTER TABLE roles ADD COLUMN isWhatsApp INTEGER DEFAULT 0");
} catch (e) { }

// Users Table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT,
    email TEXT UNIQUE,
    username TEXT,
    password TEXT,
    roleId INTEGER,
    societyId INTEGER,
    memberId INTEGER,
    mobileNumber TEXT,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed initial data if empty
const roleCount = db.query("SELECT COUNT(*) as count FROM roles").get() as { count: number };
if (roleCount.count === 0) {
  db.run("INSERT INTO roles (name, description, permissions) VALUES ('Super Admin', 'Full system access', 'all')");
  db.run("INSERT INTO roles (name, description, permissions) VALUES ('Society Admin', 'Access to own society', 'societies:edit,members:edit,reports:view,dashboard:view,settings:edit')");
  db.run("INSERT INTO roles (name, description, permissions) VALUES ('Member', 'Limited access', 'dashboard:view')");
}

db.run(`
  UPDATE roles
  SET permissions = CASE
    WHEN permissions IS NULL OR TRIM(permissions) = '' THEN 'logs:view'
    WHEN permissions LIKE '%logs%' THEN permissions
    WHEN permissions = 'all' THEN 'all'
    ELSE permissions || ',logs:view'
  END
  WHERE name IN ('Super Admin', 'Society Admin')
`);

// Seed initial users if they don't exist
const existingUserCount = db.query("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (existingUserCount.count === 0) {
  db.run(`
    INSERT INTO users (fullName, email, username, password, roleId, status, mobileNumber) 
    VALUES ('Administrator', 'admin@society.com', 'admin', 'admin123', 1, 'Active', '919876543210')
  `);
  db.run(`
    INSERT INTO users (fullName, email, username, password, roleId, status, mobileNumber) 
    VALUES ('Society Secretary', 'secretary@society.com', 'secretary', 'sec123', 2, 'Active', '919876543211')
  `);
  db.run(`
    INSERT INTO users (fullName, email, username, password, roleId, status, societyId, memberId, mobileNumber) 
    VALUES ('Society Member', 'member@society.com', 'member', 'mem123', 3, 'Active', 1, 1, '919876543212')
  `);
}
