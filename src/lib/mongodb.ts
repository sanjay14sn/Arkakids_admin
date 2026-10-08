import dns from "dns"
import mongoose from "mongoose"

// macOS / Node often fail Atlas lookups on IPv6 first (ENOTFOUND on shard hosts).
dns.setDefaultResultOrder("ipv4first")

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local")
}

interface MongooseGlobal {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseGlobal: MongooseGlobal
}

let cached: MongooseGlobal = global._mongooseGlobal

if (!cached) {
  cached = global._mongooseGlobal = { conn: null, promise: null }
}

const connectOpts = {
  bufferCommands: false,
  family: 4 as const,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
}

async function connectWithRetry(): Promise<typeof mongoose> {
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await mongoose.connect(MONGODB_URI, connectOpts)
    } catch (error) {
      lastError = error
      cached.promise = null
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
      }
    }
  }
  throw lastError
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn
  }

  cached.conn = null

  if (!cached.promise) {
    cached.promise = connectWithRetry()
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    cached.conn = null
    throw e
  }

  return cached.conn
}

export default connectDB
