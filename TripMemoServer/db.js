import mysql from "mysql2/promise";

const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "tripmemodb",
});

export default db;
