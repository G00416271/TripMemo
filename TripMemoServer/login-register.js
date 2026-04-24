import bcrypt from "bcrypt";
import supabase from "./supabaseClient.js";

export default async function login(e, u, p) {
  const credential = e || u;
  if (!credential) return;

  const { data: rows, error } = await supabase
    .from("users")
    .select("user_id, email, username, password_hash")
    .or(`email.eq.${credential},username.eq.${credential}`);

  if (error || !rows || rows.length === 0) return;

  const match = await bcrypt.compare(p, rows[0].password_hash);
  if (!match) return;

  return {
    user_id: rows[0].user_id,
    username: rows[0].username,
    email: rows[0].email,
  };
}

export async function register(u, f, l, e, p) {
  try {
    const hash = await bcrypt.hash(p, 10);

    const { data, error } = await supabase
      .from("users")
      .insert({
        username: u,
        first_name: f,
        last_name: l,
        email: e,
        password_hash: hash,
      })
      .select("user_id, email, username")
      .single();

    if (error) {
      console.error("Supabase register error:", error.message || JSON.stringify(error));
      throw error;
    }

    return {
      user_id: data.user_id,
      username: data.username,
      email: data.email,
    };
  } catch (err) {
    console.error("Register exception:", err.message || JSON.stringify(err));
    throw err;
  }
}