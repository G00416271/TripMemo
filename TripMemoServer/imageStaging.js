import heicConvert from "heic-convert";

export default async function stage(images) {
  return Promise.all(
    images.map(async (image) => {
      const isHeic =
        image.mimetype === "image/heic" || image.mimetype === "image/heif";

      if (!isHeic) return image;

      try {
        const output = await heicConvert({
          buffer: image.buffer,
          format: "JPEG",
          quality: 0.6,
        });

        // ✅ convert Uint8Array -> Buffer
        const jpegBuffer = Buffer.isBuffer(output) ? output : Buffer.from(output);

        return {
          ...image,
          buffer: jpegBuffer,
          mimetype: "image/jpeg",
        };
      } catch (e) {
        console.log("heic-convert error:", e);
        return image;
      }
    })
  );
}
