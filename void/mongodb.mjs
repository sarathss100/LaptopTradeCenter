// import mongoose, { Schema } from "mongoose";

// Connect to MongoDB using an IIFE
// ( async() => {
//     try {
//         await mongoose.connect( 'mongodb://localhost:27017/LTC');
//         console.log( `Connected to MongoDB successfully` );
//     } catch ( error ) {
//         console.error( `Failed to connect to MongoDB`, error );
//     }
// } )();

// Define adminCredentialSchema
// const adminCredentialsSchema = new mongoose.Schema( {
//     email: { type: String, required: true },
//     password: { type: String, required: true }
// } );

// Definde adminMasterPassword
// const adminMasterPassword = new mongoose.Schema( {
//     masterpassword: { type: String, required: true }
// } );

// Define Refresh Token Schema for admin
// const adminRefreshTokenSchema = new mongoose.Schema( {
//     refreshToken : { type : String, required : true }
// } );

// Define couponsSchema
// const couponSchema = new mongoose.Schema( {
//     coupon_code: { type: String, required: true, unique: true },
//     coupon_discount: { type: Number, required: true },
//     coupon_expiration : { type: Date, required: true }
// } );

// Define Product details Schema
// const productDetailsSchema = new mongoose.Schema( {
//   product_name: { type: String },
//   product_price: { type: Number },
//   product_quantity: { type: Number },
//   product_brand: { type: String },
//   product_model: { type: String },
//   processor: { type: String },
//   processor_generation: { type: String },
//   ram_capacity: { type: String },
//   ram_generation: { type: String },
//   storage_type: { type: String },
//   operating_system: { type: String },
//   usage: { type: String }, 
//   weight: { type: String },
//   touch_screen: { type: String },
//   graphics_type: { type: String },
//   graphics_generation: { type: String },
//   graphics_capacity: { type: String },
//   product_images: { data: Buffer, contentType: String, enum: ['image/jpeg'] },
//   product_color: { type: String },
//   product_listed: { type: String },
//   customer_ratings: { type: Number },
//   isDeleted: { type : Boolean },
//   coupon: { type: Schema.Types.ObjectId, ref: 'Coupon'}
// } );

// Define userCredentialSchema
// const userCredentialSchema = new mongoose.Schema( {
//     first_name : { type: String },
//     second_name : { type: String},
//     email: { type: String, unique: true },
//     phone_number: { type: String },
//     password: { type: String },
//     address: [ {
//         address_line_1: { type: String },
//         address_line_2: { type: String },
//         street: { type: String },
//         city: { type: String },
//         state: { type: String },
//         country: { type: String },
//         zip_code: { type: String }
//     }],
//     joined_date: { type: Date, default: Date.now },
//     isBlocked: { type: String, default: 'Unblocked' },
//     profile_picture: { type: Buffer },
//     refreshToken: { type: String },
//     isDeleted: { type: Boolean, default: false },
//     googleId: { type: String },
//     otp: { type: Number },
//     otpExpires: { type: Date },
//     order: { type: Schema.Types.ObjectId, ref: 'Order' }
// } );

// Create an index on email field on userCredentials
// userCredentialSchema.index( { email: 1 } );

// Create adminCredentialsModel
// export const adminCredentialsModel = mongoose.model( 'adminCredentials', adminCredentialsSchema );

// Create admingMasterPasswordModel
// export const adminMasterPasswordModel = mongoose.model( 'adminMasterPassword', adminMasterPassword );

// Create userCredentialsModel
// export const userCredentialsModel = mongoose.model( 'userCredentials', userCredentialSchema );

// Create productDetailsModel
// export const productDetailsModel = mongoose.model( 'products', productDetailsSchema );

// Create adminRefreshTokenModel
// export const adminRefreshTokenModel = mongoose.model( 'adminRefreshToken', adminRefreshTokenSchema );

// Create couponModel
// export const Coupon = mongoose.model( 'Coupon', couponSchema );