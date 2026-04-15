import mysql from "mysql2/promise";

export async function mysqlConnectTest() {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",         
      password: "",
      database: "tripmemodb"
    });

    await connection.execute("SELECT 1");
    await connection.end();

    return {
      ok: true,
      message: "MySQL connection successful",
    };
  } catch (err) {
    return {
      ok: false,
      message: "MySQL connection failed",
      error: err.message,
    };
  }
}
