import mongoose from "mongoose";

let connPromise = null;

export function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("[db] MONGO_URI not set; Mongo will not connect");
    return Promise.reject(new Error("MONGO_URI not set"));
  }
  if (!connPromise) {
    connPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
  }
  return connPromise;
}

export default connectMongo;
