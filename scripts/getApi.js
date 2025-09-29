const dotenv = require("dotenv");
dotenv.config();

const env = process.env.APP_ENV || "development";

let apiUrl;
switch (env) {
  case "uat":
    apiUrl = process.env.UAT_API;
    break;
  case "demo":
    apiUrl = process.env.DEMO_API;
    break;
  case "production":
    apiUrl = process.env.PROD_API;
    break;
  default:
    apiUrl = process.env.DEV_API;
}

console.log(apiUrl);