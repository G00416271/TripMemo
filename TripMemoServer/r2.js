import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
dotenv.config();

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = "tripmemo-img";

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

export async function deleteFromR2(prefix) {
  // If you mean "everything under a folder", pass "canvas/65/" (with trailing slash)
  const listResponse = await r2.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
    })
  );

  const contents = listResponse.Contents ?? [];
  if (contents.length === 0) return 0;

  const objectsToDelete = contents.map((file) => ({ Key: file.Key }));

  const deleteResponse = await r2.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: objectsToDelete, Quiet: true },
    })
  );

  // If any failed, throw an error so you notice
  if (deleteResponse.Errors?.length) {
    throw new Error(
      deleteResponse.Errors
        .map((e) => `${e.Key}: ${e.Code}`)
        .join(", ")
    );
  }

  return objectsToDelete.length;

}