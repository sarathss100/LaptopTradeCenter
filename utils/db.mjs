import mongoose from "mongoose"; // Import the mongoose library for MongoDB connection and schema management
import configSettings from '../config/config.mjs'; // Import configuration settings, particularly the MongoDB URI, from a config file

/**
 * Asynchronous function to connect to the MongoDB database using Mongoose.
 * The connection URI is obtained from the configSettings.
 * 
 * @async
 * @function connectDB
 * @returns {Promise<void>} Logs a success message if connected, otherwise logs an error.
 */
const connectDB = async () => {
    try {
        // Attempt to connect to MongoDB using the URI from the configuration settings
        await mongoose.connect(configSettings.database.mongoURI);
        console.log(`Connected to MongoDB successfully`); // Log a success message if connection is successful
    } catch (error) {
        console.error(`Failed to connect to MongoDB`, error); // Log an error message if connection fails
    }
};

export default connectDB; // Export the connectDB function as the default export of the module
