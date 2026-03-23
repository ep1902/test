require("dotenv").config();
const { Pool } = require("pg");

console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD typeof:", typeof process.env.DB_PASSWORD);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
