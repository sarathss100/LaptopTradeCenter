import { config } from "dotenv";

// Load environment variables from .env file
config();

// Define the configuration object
const configSettings = {

    // Server Configuration
    server: {
        port: process.env.PORT || 8080, // Default to port 5000 if not specified
    },

    // Database configuration
    database: {
        mongoURI: process.env.MONGO_URI // MongodDB connection string from .env
    }

};

export default configSettings;