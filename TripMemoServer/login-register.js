import bcrypt from "bcrypt";
import db from "./db.js";

export default async function login(e, u, p) {
  let logincredentials = "";

  if (e != "") {
    logincredentials = e;
  } else if (u != "") {
    logincredentials = u;
  } else {
    return;
  }

  const { rows } = await db.query(
    `SELECT user_id, email, username, password_hash
     FROM users WHERE email = $1 OR username = $1`,
    [logincredentials],
  );

  if (rows.length < 1) {
    return;
  }

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

  // Use RETURNING to fetch the inserted row in a single round-trip
  const { rows } = await db.query(
    `INSERT INTO users (username, first_name, last_name, email, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING user_id, email, username`,
    [u, f, l, e, hash],
  );

  return {
    user_id: rows[0].user_id,
    username: rows[0].username,
    email: rows[0].email,
  };
}