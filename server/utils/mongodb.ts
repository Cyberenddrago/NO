import mongoose from "mongoose";

const MONGODB_URI =
  "mongodb+srv://BBAP_YASHENSOLUTIONS_CEO:8NCXqIgFW4HwzDNh@cluster0.hmil8.azure.mongodb.net/test3";

interface MongoConnection {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

// Use a global cache to survive HMR/reloads
const g: any = globalThis as any;
if (!g.__mongooseCache) {
  g.__mongooseCache = { conn: null, promise: null } as MongoConnection;
}
let cached: MongoConnection = g.__mongooseCache;

export async function connectToDatabase(): Promise<mongoose.Connection> {
  // If already connected, reuse
  if (mongoose.connection?.readyState === 1) {
    return mongoose.connection;
  }
  // If currently connecting and we have a promise, await it
  if (mongoose.connection?.readyState === 2 && cached.promise) {
    cached.conn = await cached.promise;
    return cached.conn!;
  }
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = { bufferCommands: false } as any;
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log("Connected to MongoDB successfully");
      return m.connection;
    }).catch((err) => {
      // If already connected elsewhere, reuse existing connection
      if (err && String(err.message || err).includes("openUri() on an active connection")) {
        return mongoose.connection;
      }
      throw err;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
