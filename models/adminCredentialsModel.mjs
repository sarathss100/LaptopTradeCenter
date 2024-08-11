import mongoose, { Schema } from "mongoose";

// Define adminCredentialsSchema
const adminCredentialsSchema = new mongoose.Schema( {
    email: { type: String, required: true },
    password: { type: String, required: true }
} );

// Create couponModel
export const adminCredentials = mongoose.model( 'adminCredentials', adminCredentialsSchema );

