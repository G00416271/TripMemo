import { spawn } from "child_process";

export function clipAnalyse(images) {
  return new Promise((resolve, reject) => {
    const py = spawn("python", ["image_classification/i_class.py"]);

    let out = "";
    let err = "";

    py.stdout.on("data", d => (out += d.toString()));
    py.stderr.on("data", d => (err += d.toString()));

    const payload = images.map(img => ({
      name: img.name,
      data: img.buffer.toString("base64")
    }));

    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();

    py.on("close", code => {
      if (code !== 0) return reject(new Error(err || "Python failed"));
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(new Error("Bad JSON from python:\n" + out));
      }
    });
  });
}
