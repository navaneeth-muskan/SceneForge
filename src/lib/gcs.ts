import "server-only";

import { Storage } from "@google-cloud/storage";
import { GoogleAuth } from "google-auth-library";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import os from "os";
import path from "path";

function getServiceAccountFilePath(): string {
  const filePath = process.env.SERVICE_ACCOUNT_FILE;
  if (filePath && fs.existsSync(filePath)) {
    return filePath;
  }

  const json = process.env.SERVICE_ACCOUNT_JSON;
  if (json) {
    const tempPath = path.join(os.tmpdir(), "service-account.json");
    if (!fs.existsSync(tempPath)) {
      fs.writeFileSync(tempPath, json, "utf8");
    }
    return tempPath;
  }

  throw new Error(
    "No service account credentials found. Set SERVICE_ACCOUNT_FILE or SERVICE_ACCOUNT_JSON.",
  );
}

const serviceAccountPath = getServiceAccountFilePath();

const projectId = process.env.GCP_PROJECT_ID;
if (!projectId) {
  throw new Error("GCP_PROJECT_ID is required.");
}

const bucketName = process.env.BUCKET_NAME;
if (!bucketName) {
  throw new Error("BUCKET_NAME is required.");
}

export const auth = new GoogleAuth({
  keyFile: serviceAccountPath,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

export const storage = new Storage({
  projectId,
  keyFilename: serviceAccountPath,
});

export const BUCKET_NAME = bucketName;
export const bucket = storage.bucket(BUCKET_NAME);

export const genAI = new GoogleGenAI({
  vertexai: true,
  project: projectId,
  location: "us-central1",
});

export async function listFiles(): Promise<
  { name: string; uri: string; updated?: string }[]
> {
  const [files] = await bucket.getFiles();
  return files.map((file) => ({
    name: file.name,
    uri: `gs://${BUCKET_NAME}/${file.name}`,
    updated: file.metadata.updated,
  }));
}

export async function uploadFile(
  localPath: string,
  destFileName: string,
): Promise<string> {
  await bucket.upload(localPath, { destination: destFileName });
  return `gs://${BUCKET_NAME}/${destFileName}`;
}

export async function uploadBuffer(
  buffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  const file = bucket.file(fileName);
  await file.save(buffer, { contentType });
  return `gs://${BUCKET_NAME}/${fileName}`;
}

export async function getUploadUrl(
  fileName: string,
  fileType: string,
): Promise<string> {
  const options = {
    version: "v4" as const,
    action: "write" as const,
    expires: Date.now() + 15 * 60 * 1000,
    contentType: fileType,
  };

  const [url] = await bucket.file(fileName).getSignedUrl(options);
  return url;
}

export async function getDownloadUrl(
  fileName: string,
  expiresMs = 7 * 24 * 60 * 60 * 1000,
): Promise<string> {
  const [url] = await bucket.file(fileName).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + expiresMs,
  });
  return url;
}

export async function deleteFile(
  fileName: string,
): Promise<{ success: true; message: string }> {
  await bucket.file(fileName).delete();
  return { success: true, message: `Deleted ${fileName}` };
}

export async function getFileMetadata(fileName: string) {
  const [metadata] = await bucket.file(fileName).getMetadata();
  return metadata;
}
