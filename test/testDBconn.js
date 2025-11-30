import mysql from "mysql2/promise";

async function testConnection() {
  try {
    const db = await mysql.createConnection({
      host: "tripmemo",
      user: "root",
      password: "",
      database: "tripmemodb",
    });

    console.log("Connected successfully!");
    await db.end();
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

testConnection();
