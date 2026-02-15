import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
dotenv.config();

console.log("R2_ENDPOINT:", process.env.R2_ENDPOINT);
console.log("R2_BUCKET:", process.env.R2_BUCKET);
console.log("R2_ACCESS_KEY_ID length:", (process.env.R2_ACCESS_KEY_ID || "").length);
console.log("R2_SECRET_ACCESS_KEY length:", (process.env.R2_SECRET_ACCESS_KEY || "").length);


const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = "tripmemo-img"

export async function generateSignedUrl(key) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return await getSignedUrl(r2, command, { expiresIn: 300 });
}

export async function uploadToR2({ key, buffer, contentType }) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await r2.send(command);
  return key;
}
