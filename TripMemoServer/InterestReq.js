import mysql from "mysql2/promise";


//const user = "schannie";

export default async function getInterests(fields) {

  const u = fields.user;
  const db = await mysql.createConnection({
      host: "tripmemo",
      user: "root",
      password: "",
      database: "tripmemodb",
  });



  const [rows] = await db.execute(
    "SELECT user_profile FROM users WHERE username = ?",
    [u]
  );

  if (rows.length === 0) {
    return { error: "No user found" };
  }

  const profile = rows[0].user_profile;

  return {
    user: u,
    interests: profile
  };
}

//getMariamInterests(user);
