import neo4j from "neo4j-driver";

const URI = "neo4j://127.0.0.1:7687";
const USER = "neo4j";
const PASSWORD = "TripMemoGalway";

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

export default async function getNodes(tags = []) {
  const session = driver.session();

  try {
    // Normalize tags to a clean string array
    if (!Array.isArray(tags)) tags = [tags];

    tags = tags
      .flat(Infinity)
      .filter(t => typeof t === "string" && t.trim() !== "");

    // log what is actually being passed:
    console.log("Neo4j received tags:", tags);

    if (tags.length === 0) {
      return [];
    }

    const query = `
      UNWIND $tags AS tag
      MATCH (e)
      WHERE toLower(e.name) CONTAINS toLower(tag)
      OPTIONAL MATCH (e)-[r]-(related)
      OPTIONAL MATCH (related)-[r2]-(related2)
      RETURN e, r, related, r2, related2
    `;

    const result = await session.run(query, { tags });

    return result.records.map(record => ({
      node: record.get("e")?.properties ?? null,
      relationship1: record.get("r")?.type ?? null,
      relatedNode1: record.get("related")?.properties ?? null,
      relationship2: record.get("r2")?.type ?? null,
      relatedNode2: record.get("related2")?.properties ?? null,
    }));

  } catch (err) {
    console.error("Query error:", err);
    return { error: "Query failed" };
  } finally {
    await session.close();
  }
}
