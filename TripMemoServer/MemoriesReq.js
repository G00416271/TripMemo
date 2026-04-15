import mysql from "mysql2/promise";
import db from "./db.js";

export default async function getMemories(formData) {
  if (formData.action === "fetch") {
    const [rows] = await db.execute(
      "SELECT memory_id, title, elements FROM memories WHERE user_id = ?",
      [formData.user_id],
    );
    return rows;
  }

  if (formData.action === "delete") {
    const memoryId = Number(formData.memory_id);
    if (!Number.isFinite(memoryId) || memoryId <= 0) {
      return { error: "memory_id required" };
    }

    const [result] = await db.execute(
      "DELETE FROM memories WHERE memory_id = ?",
      [memoryId],
    );
    return { ok: true, affectedRows: result.affectedRows };
  }

  if (formData.action === "create") {
  const title = String(formData.title ?? "").trim();
  const userId = Number(formData.user_id);

  if (!title) return { error: "title required" };

  const [result] = await db.execute(
    "INSERT INTO memories (user_id, title, elements, tags) VALUES (?, ?, JSON_OBJECT(), JSON_ARRAY())",
    [userId, title]
  );

  // return the created memory so frontend can add it immediately
  return {
    ok: true,
    memory: {
      memory_id: result.insertId,
      title,
      thumbnail: "",
      elements: {},     // optional, but nice if UI expects it
      tags: []          // optional
    }
  };
}
}
