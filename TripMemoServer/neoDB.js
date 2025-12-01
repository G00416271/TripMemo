// eyreSquareQuery.js
import neo4j from "neo4j-driver";

// --- CONFIGURE CONNECTION ---
const URI = "neo4j://127.0.0.1:7687";
const USER = "neo4j";
const PASSWORD = "TripMemoGalway";

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

export default async function getNodes(tags = []) {
  const session = driver.session();

  try {
    // Ensure tags is an array
    if (!Array.isArray(tags)) {
      tags = [tags];
    }

    // MAIN QUERY:
    // Find all nodes with a name matching ANY tag
    // Find 1-hop and 2-hop related nodes
    const query = `
      UNWIND $tags AS tag
      MATCH (e {name: tag})
      OPTIONAL MATCH (e)-[r]-(related)
      OPTIONAL MATCH (related)-[r2]-(related2)
      RETURN e, r, related, r2, related2
    `;

    const result = await session.run(query, { tags });

    // Format
    const formatted = result.records.map(record => ({
      node: record.get("e")?.properties ?? null,
      relationship1: record.get("r")?.type ?? null,
      relatedNode1: record.get("related")?.properties ?? null,
      relationship2: record.get("r2")?.type ?? null,
      relatedNode2: record.get("related2")?.properties ?? null,
    }));

    return formatted;

  } catch (err) {
    console.error("Query error:", err);
    return { error: "Query failed" };
  } finally {
    await session.close();
  }
}

// Optional CLI runner
if (process.argv.includes("--run")) {
  const tags = ["Eyre Square", "Spanish Arch"]; // example multiple tags
  getNodes(tags).then(res => {
    console.log(JSON.stringify(res, null, 2));
    driver.close();
  });
}
