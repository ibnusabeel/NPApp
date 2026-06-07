import mongoose, { Connection } from "mongoose";

let slipCheckConn: Connection | null = null;
let slipCheckPromise: Promise<Connection> | null = null;

const SLIPCHECK_MONGODB_URI =
    process.env.SLIPCHECK_MONGODB_URI || process.env.MONGODB_URI || "";

async function dbSlipCheckConnect(): Promise<Connection> {
    if (slipCheckConn) return slipCheckConn;

    if (!slipCheckPromise) {
        slipCheckPromise = mongoose
            .createConnection(SLIPCHECK_MONGODB_URI, {
                bufferCommands: false,
                family: 4,
                serverSelectionTimeoutMS: 30000,
                connectTimeoutMS: 30000,
                maxPoolSize: 3,
                minPoolSize: 1,
                maxIdleTimeMS: 30000,
            })
            .asPromise()
            .then((conn) => {
                console.log("[slipcheck] MongoDB connected");
                return conn;
            });
    }

    try {
        slipCheckConn = await slipCheckPromise;
    } catch (e) {
        slipCheckPromise = null;
        throw e;
    }

    return slipCheckConn;
}

export default dbSlipCheckConnect;
