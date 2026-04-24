import supabase from "./supabaseClient.js";

export default async function getMemories(formData) {
  if (formData.action === "fetch") {
    const { data, error } = await supabase
      .from("memories")
      .select("memory_id, title, elements, created_at, privacy_level")
      .eq("user_id", formData.user_id);

    if (error) throw error;
    return data;
  }

  if (formData.action === "delete") {
    const memoryId = Number(formData.memory_id);
    if (!Number.isFinite(memoryId) || memoryId <= 0) {
      return { error: "memory_id required" };
    }

    const { error } = await supabase
      .from("memories")
      .delete()
      .eq("memory_id", memoryId);

    if (error) throw error;
    return { ok: true };
  }

  if (formData.action === "create") {
    const title = String(formData.title ?? "").trim();
    const userId = String(formData.user_id ?? "").trim();
    const privacyLevel = String(formData.privacy_level ?? "public").trim();

    if (!title) return { error: "title required" };
    if (!userId) return { error: "user_id required" };

    const { data, error } = await supabase
      .from("memories")
      .insert({
        user_id: userId,
        title,
        elements: {},
        tags: [],
        privacy_level: privacyLevel,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ok: true,
      memory: {
        memory_id: data.memory_id,
        title: data.title,
        privacy_level: data.privacy_level,
        created_at: data.created_at,
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

    const { error } = await supabase
      .from("memories")
      .update({ privacy_level: privacyLevel })
      .eq("memory_id", memoryId);

    if (error) throw error;
    return { ok: true };
  }
}