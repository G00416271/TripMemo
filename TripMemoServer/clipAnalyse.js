import { spawn } from "child_process";

export function clipAnalyse(images) {
  if (!images || !Array.isArray(images)) {
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    const py = spawn("python", ["-u", "image_classification/i_class.py"]);
    let out = "", err = "";

    py.stdout.on("data", d => out += d.toString());
    py.stderr.on("data", d => err += d.toString());

    // Catch stdin write errors (EOF = Python died before reading)
    py.stdin.on("error", e => {
      if (e.code !== "EPIPE" && e.code !== "EOF") reject(new Error(`stdin error: ${e.message}`));
      // otherwise swallow — close handler will report the real error
    });

    py.on("error", e => reject(new Error(`Spawn error: ${e.message}`)));

    const validImages = images.filter(img =>
      img?.name && typeof img.data === "string" && img.data.length > 0
    );

    if (validImages.length === 0) {
      py.stdin.end();
      return resolve([]);
    }

    py.on("close", code => {
      if (code !== 0) {
        // Print Python's stderr so you can see the real crash reason
        return reject(new Error(`Python exited ${code}:\n${err}`));
      }
      try {
        resolve(JSON.parse(out.trim()));
      } catch {
        reject(new Error("Bad JSON from Python:\n" + out));
      }
    });

    // Write AFTER attaching close handler
    try {
      py.stdin.write(JSON.stringify(validImages));
      py.stdin.end();
    } catch (e) {
      // Will be caught by close handler above
    }
  });
}
