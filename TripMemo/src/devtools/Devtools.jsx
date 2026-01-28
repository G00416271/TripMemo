import { useEffect, useState } from "react";


//SERVER CONNECTION
export default function ConnStatus() {
  const [serverStatus, setServerStatus] = useState("testing server connection...");
  const [neoStatus, setNeoStatus] = useState("testing neo4j connection...");
  const [mysqlStatus, setMysqlStatus] = useState("testing mysql connection...");

  useEffect(() => {
    async function checkConnection() {
      try {
        const res = await fetch("http://localhost:5000/ping", {
          method: "GET",
        });

        setServerStatus(res.ok ? "server connection ok" : "connection failed");

        console.log(res.json);
      } catch (err) {
        setServerStatus("Error connecting to server");
      }
    }

    checkConnection();
  }, []);

  const IsOk = serverStatus === "server connection ok";


//NEODB CONNECTION
    useEffect(() => {
      async function checkConnection() {
        try {
          const res = await fetch("http://localhost:5000/neoping", {
            method: "GET",
          });

          setNeoStatus(res.ok ? "neo4J connection ok" : "neo4J connection failed");

          console.log(res.json);
        } catch (err) {
          setNeoStatus("Error connecting to server");
        }
      }

      checkConnection();
    }, []);

    const neoIsOk = neoStatus === "neo4J connection ok";

    //MysqlConnection

    useEffect(() => {
      async function checkConnection() {
        try {
          const res = await fetch("http://localhost:5000/mysqlping", {
            method: "GET",
          });

          setMysqlStatus(res.ok ? "mysql connection ok" : "mysql connection failed");

          console.log(res.json);
        } catch (err) {
          setMysqlStatus("Error connecting to server");
        }
      }

      checkConnection();
    }, []);

    const mysqlIsOk = mysqlStatus === "mysql connection ok";
    return (
      <status>
        <h1
          style={{
            padding: "10px",
            backgroundColor: IsOk ? "lightgreen" : "darkred",
            color: "white",
            textAlign: "center",
          }}
        >
          {serverStatus}
        </h1>

        <h1
          style={{
            padding: "10px",
            backgroundColor: neoIsOk ? "darkblue" : "darkred",
            color: "white",
            textAlign: "center",
          }}
        >
          {neoStatus}
        </h1>

                <h1
          style={{
            padding: "10px",
            backgroundColor: mysqlIsOk ? "darkorange" : "darkred",
            color: "white",
            textAlign: "center",
          }}
        >
          {mysqlStatus}
        </h1>
      </status>
    );
}
