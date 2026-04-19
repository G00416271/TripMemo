import db from "./db.js";

export default async function getMemories(formData) {

  if (formData.action === "fetch") {
    const [rows] = await db.execute(
      "SELECT memory_id, title, elements, created_at, privacy_level FROM memories WHERE user_id = ?",
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
    const userId = String(formData.user_id ?? "").trim();
    const privacyLevel = String(formData.privacy_level ?? "public").trim();

    if (!title) return { error: "title required" };
    if (!userId) return { error: "user_id required" };

    const [result] = await db.execute(
      "INSERT INTO memories (user_id, title, elements, tags, privacy_level) VALUES (?, ?, JSON_OBJECT(), JSON_ARRAY(), ?)",
      [userId, title, privacyLevel],
    );

    return {
      ok: true,
      memory: {
        memory_id: result.insertId,
        title,
        privacy_level: privacyLevel,
        created_at: new Date().toISOString(),
        thumbnail: "",
        elements: {},
        tags: [],
      },
    };
  }

  // ← now a top-level block, not nested inside create
  if (formData.action === "update_privacy") {
    const memoryId = Number(formData.memory_id);
    const privacyLevel = String(formData.privacy_level ?? "public");

    if (!Number.isFinite(memoryId) || memoryId <= 0) {
      return { error: "memory_id required" };
    }

    await db.execute(
      "UPDATE memories SET privacy_level = ? WHERE memory_id = ?",
      [privacyLevel, memoryId],
    );

    return { ok: true };
  }
}