import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  "neo4j://127.0.0.1:7687",
  neo4j.auth.basic("neo4j", "TripMemoGalway")
);

export async function neoConnectTest() {
  try {
    await driver.verifyConnectivity();
    return {
      ok: true,
      message: "Connection successful",
    };
  } catch (err) {
    return {
      ok: false,
      message: "Connection failed",
      error: err.message,
    };
  }
}

