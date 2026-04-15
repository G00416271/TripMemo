import bcrypt from "bcrypt";
import db from "./db.js";


//login
export default async function login(e, u, p) {
  let logincredentials = "";

  //choose to sign in via username or email
  if (e != "") {
    logincredentials = e;
  } else if (u != "") {
    logincredentials = u;
  } else {
    return;
  }

  //calling for stored username and password
  const [rows] = await db.execute(
    `SELECT user_id, email, username, password_hash FROM users WHERE email = ?`,
    [logincredentials],
  );

  if (rows.length < 1) {
    return;
  }



  //   await db.execute(
  //     `UPDATE users
  //     SET password_hash = ?
  //     WHERE user_id = ?;
  //     `,[hash, 10101019]
  //   );

  //if the stored password and the attempted password are the same
  const match = await bcrypt.compare(p, rows[0].password_hash);
  if (match) {
    return {
      user_id: rows[0].user_id,
      username: rows[0].username,
      email: rows[0].email,
    };
  } else {
    return;
  }
}

export async function register(u, f, l, e, p) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(p, saltRounds);

    await db.execute(
    `INSERT INTO users (username, first_name, last_name, email, password_hash)
    VALUES (?, ?, ?, ?, ?);
    `,
    [u, f, l, e, hash]
  );

  const [rows] = await db.execute(
    `SELECT user_id, email, username FROM users WHERE email = ?`,
    [e],
  );

  return {
      user_id: rows[0].user_id,
      username: rows[0].username,
      email: rows[0].email,
    };
}

//register("testuser", "Test", "User", "test@example.com", "password123");
