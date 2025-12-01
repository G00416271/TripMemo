import mysql from "mysql2/promise";

export default async function getInterests(tags = [], fields) {
  const u = fields.user;

  if (!Array.isArray(tags)) {
    tags = [tags];
  }

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
    await db.end();
    return { error: "No user found" };
  }

  let profile = rows[0].user_profile;
  if (typeof profile === "string") {
    profile = JSON.parse(profile);
  }

  // Convert [{interest: "..."}] → ["..."]
  const profileInterests = profile.map(
    item => item.interest.toLowerCase()
  );

  // Bidirectional partial matching
  const matched = tags.filter(tag => {
    const tagLower = tag.toLowerCase();
    return profileInterests.some(interest =>
      interest.includes(tagLower) || tagLower.includes(interest)
    );
  });

  await db.end();

  return {
    user: u,
    interests: profileInterests,
    matchedInterests: matched,
    inputTags: tags
  };
}