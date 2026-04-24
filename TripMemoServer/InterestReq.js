import supabase from "./supabaseClient.js";

export default async function getInterests(tags = [], fields) {
  const u = fields?.user || fields?.username;
  if (!u) return { error: "username missing" };

  tags = tags
    .flat(Infinity)
    .filter((x) => typeof x === "string")
    .map((x) => x.toLowerCase());

  if (!Array.isArray(tags)) tags = [tags];

  const { data: rows, error } = await supabase
    .from("users")
    .select("user_profile")
    .eq("username", u);

  if (error) throw error;
  if (!rows || rows.length === 0) return { error: "No user found" };

  let profile = rows[0].user_profile;
  if (typeof profile === "string") profile = JSON.parse(profile);

  const profileInterests = profile.map((item) => item.interest.toLowerCase());

  const matched = tags.filter((tag) => {
    const tagLower = tag.toLowerCase();
    return profileInterests.some(
      (interest) => interest.includes(tagLower) || tagLower.includes(interest)
    );
  });

  return {
    user: u,
    interests: profileInterests,
    matchedInterests: matched,
    inputTags: tags,
  };
}