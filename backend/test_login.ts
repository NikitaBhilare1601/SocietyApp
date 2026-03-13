import { AuthController } from "./src/controllers/auth";
import { sequelize } from "./src/models/index";

const mockReq = {
  json: async () => ({ email: "admin@society.com", password: "admin123" })
};

await sequelize.sync();
const response = await AuthController.login(mockReq);
const data = await response.json();
console.log("MOCK LOGIN RESPONSE:");
console.log(JSON.stringify(data, null, 2));
process.exit();
