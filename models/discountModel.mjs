import mongoose, { Schema } from "mongoose";

// Define couponsSchema
const discountSchema = new mongoose.Schema( {
    coupon_percentage: { type: Number, required: true },
    discount_expiration : { type: Date, required: true },
}, { timestamps: true } );

// Create couponModel
export const Discounts = mongoose.model( 'Discounts', discountSchema );