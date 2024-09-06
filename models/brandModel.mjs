import mongoose, { Schema } from "mongoose";

// Define brand Category Schema
const brandCategorySchema = new mongoose.Schema( {
  brand_name: { type: String, required: true, unique: true },
  isBlocked: { type: Boolean, default: false },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'products'}],
} );

// Create brandsModel
export const brands = mongoose.model( 'brands', brandCategorySchema );
