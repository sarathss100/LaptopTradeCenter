import mongoose, { Schema } from "mongoose";

// Define couponsSchema
const couponSchema = new mongoose.Schema({
  type_of_coupon: {
    type: String,
    enum: ["Percentage", "Fixed"],
    default: "Fixed",
  },
  discountValue: {
    type: Number,
    required: true,
  },
  brandSpecific: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brands",
      default: null,
    },
  ],
  productSpecific: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      default: null,
    },
  ],
  applicableToAllBrands: {
    type: Boolean,
    default: false,
  },
  usageCount: {
    type: Number,
    default: 1,
  },
  coupon_expiration: {
    type: Date,
    required: true,
  },
  coupon_code: {
    type: String,
    required: true,
    unique: true,
  },
});

// Create couponModel
export const Coupon = mongoose.model("Coupon", couponSchema);
