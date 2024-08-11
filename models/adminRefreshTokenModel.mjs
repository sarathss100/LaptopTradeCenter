import mongoose, { Schema } from "mongoose";

// Define Refresh Token Schema for admin
const adminRefreshTokenSchema = new mongoose.Schema( {
    refreshToken : { type : String, required : true }
} );

// Create adminRefreshTokenModel
export const adminRefreshToken = mongoose.model( 'adminRefreshToken', adminRefreshTokenSchema );
