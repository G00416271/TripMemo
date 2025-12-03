import mysql from "mysql2/promise";

export default async function getMemories(formData) {
  const db = await mysql.createConnection({
    host: "tripmemo",
    user: "root",
    password: "",
    database: "tripmemodb",
  });

  if (formData.action === "fetch") {
    const [rows] = await db.execute(
      "SELECT memory_id, title, elements FROM memories WHERE user_id = ?",
      [formData.user_id]
    );

    return rows;
  }
if (formData.action === "delete") {
  const [rows] = await db.execute(
    "DELETE FROM memories WHERE memory_id = ? AND user_id = ?",
    [formData.memory_id, formData.user_id]
  );

  return rows;
}
  if (formData.action === "create") {
    await db.execute(
      "INSERT INTO memories (user_id, title, elements) VALUES (?, ?, ?)",
      [formData.user_id, formData.title, "[]"]
    );
  }
}
