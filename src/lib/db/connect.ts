import mongoose from "mongoose";

/**
 * Cached connection to avoid creating multiple connections
 * across hot reloads in development and repeated calls in production.
 */
type ConnectionCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Use a global to persist cache between hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: ConnectionCache | undefined;
}

const cached: ConnectionCache = global.__mongooseCache ?? {
  conn: null,
  promise: null,
};

global.__mongooseCache = cached;

export default async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.DATABASE_URI;

  if (!uri) {
    throw new Error(
      "DATABASE_URI is not defined. Add it to your .env.local file."
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
      })
      .catch((err) => {
        // Reset so the next call retries
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
