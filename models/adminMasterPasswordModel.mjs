import mongoose, { Schema } from "mongoose";

// Definde adminMasterPasswordSchema
const adminMasterPasswordSchema = new mongoose.Schema( {
    masterpassword: { type: String, required: true }
} );

// Create admingMasterPasswordModel
export const adminMasterPassword = mongoose.model( 'adminMasterPassword', adminMasterPasswordSchema );