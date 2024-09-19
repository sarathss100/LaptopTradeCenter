import mongoose, { Schema } from "mongoose";

// Define discountSchema
const discountSchema = new mongoose.Schema({
  type_of_discount: {
    type: String,
    enum: ["Percentage", "Fixed"],
    default: "Fixed",
  },
  discountValue: {
    type: Number,
    required: true,
  },
  categorySpecific: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  ],
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
  ReferalOffer: {
    type: Boolean,
    default: false,
  },
  discount_expiration: {
    type: Date,
    required: true,
  },
});

// Create discountModel
export const Discounts = mongoose.model("Discounts", discountSchema);
