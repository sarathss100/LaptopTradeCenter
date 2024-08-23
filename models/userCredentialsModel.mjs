import mongoose, { Schema } from "mongoose";

// Define userCredentialSchema
const userCredentialSchema = new mongoose.Schema( {
    first_name : { type: String },
    second_name : { type: String},
    email: { type: String },
    phone_number: { type: String },
    password: { type: String },
    address: [ {
        address_line_1: { type: String },
        address_line_2: { type: String },
        street: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        zip_code: { type: String }
    }],
    joined_date: { type: Date, default: Date.now },
    isBlocked: { type: String, default: 'Unblocked' },
    profile_picture: { type: Buffer },
    refreshToken: { type: String },
    isDeleted: { type: Boolean, default: false },
    googleId: { type: String },
    otp: { type: Number },
    otpExpires: { type: Date },
    order: { type: Schema.Types.ObjectId, ref: 'Order' }
} );

// Create userCredentialsModel
export const userCredentials = mongoose.model( 'userCredentials', userCredentialSchema );