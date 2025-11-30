// eyreSquareQuery.js

import neo4j from "neo4j-driver";

// --- CONFIGURE CONNECTION ---
// Replace these with your actual Neo4j credentials
const URI = "neo4j://127.0.0.1:7687";
const USER = "neo4j";
const PASSWORD = "TripMemoGalway";

// Create the driver instance
const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

async function getEyreSquareRelatedNodes() {
  const session = driver.session();

  try {
    // Query: find Eyre Square, all directly related nodes, and nodes connected to those related nodes (up to 2 hops)
    const query = `
      MATCH (e {name: "Lava Lana"})
      OPTIONAL MATCH (e)-[r]-(related)
      OPTIONAL MATCH (related)-[r2]-(related2)
      RETURN e, r, related, r2, related2
    `;

    const result = await session.run(query);

    // Convert Neo4j objects → JSON (handle optional second-hop results)
    const formatted = result.records.map(record => ({
      eyreSquare: record.get("e") ? record.get("e").properties : null,
      relationship: record.get("r") ? record.get("r").type : null,
      relatedNode: record.get("related") ? record.get("related").properties : null,
      relationship2: record.get("r2") ? record.get("r2").type : null,
      relatedNode2: record.get("related2") ? record.get("related2").properties : null
    }));

    return formatted;

  } catch (error) {
    console.error("Query error:", error);
    return { error: "An error occurred" };
  } finally {
    await session.close();
  }
}

// Run directly (optional)
if (process.argv.includes("--run")) {
  getEyreSquareRelatedNodes().then(json => {
    console.log(JSON.stringify(json, null, 2));
    driver.close();
  });
}

export default getEyreSquareRelatedNodes;
