import mongoose from "mongoose";

const mongooseInstance: { isConnected?: number } = {};

/**
 * Connects to the given MongoDB database using the DB_URL parameter in the .env.local / .env file
 * @returns none
 */
export async function connectDB() {
    // Check if there's an existing connection, return if yes
    if (mongooseInstance.isConnected) {
        console.log("[Database]: Using existing MongoDB connection");
        return;
    }

    // Connect to the db
    await mongoose.connect(`${process.env.DB_URL!}`)
        .then((db) => {
            mongooseInstance.isConnected = db.connection.readyState;
            console.log("[Database]: Connected to MongoDB");
        }).catch((error) => {
            console.error(`[Database]: MongoDB connection error: ${error}`);
        });
}
