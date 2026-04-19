import db from "./db.js";

export default async function getMemories(formData) {

  if (formData.action === "fetch") {
    const { rows } = await db.query(
      "SELECT memory_id, title, elements, created_at, privacy_level FROM memories WHERE user_id = $1",
      [formData.user_id],
    );
    return rows;
  }

  if (formData.action === "delete") {
    const memoryId = Number(formData.memory_id);
    if (!Number.isFinite(memoryId) || memoryId <= 0) {
      return { error: "memory_id required" };
    }
    const { rowCount } = await db.query(
      "DELETE FROM memories WHERE memory_id = $1",
      [memoryId],
    );
    return { ok: true, affectedRows: rowCount };
  }

  if (formData.action === "create") {
    const title = String(formData.title ?? "").trim();
    const userId = String(formData.user_id ?? "").trim();
    const privacyLevel = String(formData.privacy_level ?? "public").trim();

    if (!title) return { error: "title required" };
    if (!userId) return { error: "user_id required" };

    const { rows } = await db.query(
      `INSERT INTO memories (user_id, title, elements, tags, privacy_level)
       VALUES ($1, $2, '{}'::jsonb, '[]'::jsonb, $3)
       RETURNING memory_id`,
      [userId, title, privacyLevel],
    );

    return {
      ok: true,
      memory: {
        memory_id: rows[0].memory_id,
        title,
        privacy_level: privacyLevel,
        created_at: new Date().toISOString(),
        thumbnail: "",
        elements: {},
        tags: [],
      },
    };
  }

  if (formData.action === "update_privacy") {
    const memoryId = Number(formData.memory_id);
    const privacyLevel = String(formData.privacy_level ?? "public");

    if (!Number.isFinite(memoryId) || memoryId <= 0) {
      return { error: "memory_id required" };
    }

    await db.query(
      "UPDATE memories SET privacy_level = $1 WHERE memory_id = $2",
      [privacyLevel, memoryId],
    );

    return { ok: true };
  }
}