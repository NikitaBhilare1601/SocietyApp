import { User, Role, sequelize } from "./src/models/index";
import { Op } from "sequelize";

async function test() {
  await sequelize.authenticate();
  console.log("Connected to DB");
  // @ts-ignore
  console.log("DB Path:", sequelize.options.storage);

  try {
    const email = "admin@society.com";
    const password = "admin123";

    console.log(`Searching for email: ${email}, password: ${password}`);

    const userObj = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username: email }],
        password
      }
    });

    if (userObj) {
      console.log("SUCCESS: User found");
      console.log(JSON.stringify(userObj.toJSON(), null, 2));
    } else {
      console.log("FAILED: User not found");
      // Check if user exists without password
      const userOnly = await User.findOne({ where: { email } });
      if (userOnly) {
        console.log("User exists but password might be wrong or query failed elsewhere");
        console.log("Password in DB:", userOnly.get('password'));
      } else {
        console.log("User does not even exist with that email");
      }
    }
  } catch (error: any) {
    console.error("ERROR DURING QUERY:");
    console.error(error.message);
    if (error.original) {
      console.error("Original Error:", error.original.message);
      console.error("SQL:", error.sql);
    }
  } finally {
    process.exit();
  }
}

test();
