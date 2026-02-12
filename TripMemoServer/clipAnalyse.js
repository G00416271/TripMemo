import { spawn } from "child_process";


export function clipAnalyse(images) {
  if (!images || !Array.isArray(images)) {
    console.log("images did not reach");
    return Promise.resolve([]);
    
  }

  return new Promise((resolve, reject) => {
    const py = spawn("python", ["-u", "image_classification/i_class.py"]);

    let out = "", err = "";

    py.stdout.on("data", d => out += d.toString());
    py.stderr.on("data", d => err += d.toString());
    py.on("error", e => reject(new Error(`Spawn error: ${e.message}`)));

    const validImages = images.filter(img => 
      img?.name && img.buffer && Buffer.isBuffer(img.buffer)
    );
    
    if (validImages.length === 0) {
      py.stdin.end();
      return resolve([]);
    }

    const payload = validImages.map(img => ({
      name: img.name,
      data: img.buffer.toString("base64")
    }));

    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();

    py.on("close", code => {
      if (code !== 0) {
        return reject(new Error(err || `Python exited with code ${code}`));
      }
      try {
        resolve(JSON.parse(out.trim()));
      } catch (e) {
        reject(new Error("Bad JSON from Python:\n" + out));
      }
    });
  });
}
