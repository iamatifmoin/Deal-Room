// services/gcs.js
import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  keyFilename: process.env.FILE_PATH, // ✅ Make sure this path is correct
});

const bucketName = process.env.BUCKET_NAME; // ✅ Use your actual bucket name
const bucket = storage.bucket(bucketName);

export { storage, bucket };
