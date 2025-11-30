import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  "neo4j://127.0.0.1:7687",   // CHANGE THIS
  neo4j.auth.basic("neo4j", "TripMemoGalway")  // CHANGE THIS
);

async function test() {
  try {
    await driver.verifyConnectivity();
    console.log("Connected!");
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    await driver.close();
  }
}

test();