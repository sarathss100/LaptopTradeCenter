import mongoose, { Schema } from "mongoose";

// Define couponsSchema
const couponSchema = new mongoose.Schema( {
    coupon_code: { type: String, required: true, unique: true },
    coupon_discount: { type: Number, required: true },
    coupon_expiration : { type: Date, required: true }
} );

// Create couponModel
export const Coupon = mongoose.model( 'Coupon', couponSchema );