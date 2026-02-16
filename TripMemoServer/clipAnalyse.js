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
    py.on("error", e => reject(new Error(`Spawn error: ${e.message}`)));

    // accept {name, data} where data is base64 string
    const validImages = images.filter(img =>
      img?.name && typeof img.data === "string" && img.data.length > 0
    );

    if (validImages.length === 0) {
      py.stdin.end();
      return resolve([]);
    }

    py.stdin.write(JSON.stringify(validImages));
    py.stdin.end();

    py.on("close", code => {
      if (code !== 0) return reject(new Error(err || `Python exited with code ${code}`));
      try {
        resolve(JSON.parse(out.trim()));
      } catch {
        reject(new Error("Bad JSON from Python:\n" + out));
      }
    });
  });
}
