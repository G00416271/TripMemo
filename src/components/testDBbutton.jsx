import React, { useState } from "react";

const user = "schannie";

export default function TestDBButton({
  url = "http://localhost:5000/interestReq", // should hit your backend, NOT Vite
  method = "POST",
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  async function handleClick() {
    setLoading(true);
    setStatus(null);

    // 🔥 build FormData
    const form = new FormData();
    form.append("user", user);

    const opts = {
      method,
      body: form, // 🔥 send FormData directly
    };

    try {
      const res = await fetch(url, opts);
      const type = res.headers.get("content-type") || "";
      const data = type.includes("application/json")
        ? await res.json()
        : await res.text();

      if (!res.ok) {
        setStatus({
          ok: false,
          message: data?.message || String(data) || res.statusText,
        });
      } else {
        setStatus({
          ok: true,
          message: JSON.stringify(data),
        });
        onSuccess?.(data);
      }
    } catch (err) {
      setStatus({ ok: false, message: err.message || "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading} style={{ zIndex: 1000 }}>
        {loading ? "Sending..." : "Send request"}
      </button>

      {status && (
        <div
          style={{
            marginTop: 8,
            color: status.ok ? "green" : "crimson",
            zIndex: 1000,
          }}
        >
          {typeof status.message === "string"
            ? status.message
            : console.log(JSON.stringify(status.message))}
        </div>
      )}
    </div>
  );
}
