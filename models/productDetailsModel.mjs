import mongoose, { Schema } from "mongoose";

// Define Product details Schema
const productDetailsSchema = new mongoose.Schema( {
  product_name: { type: String },
  product_price: { type: Number },
  product_quantity: { type: Number },
  product_brand: { type: String },
  product_model: { type: String },
  processor: { type: String },
  processor_generation: { type: String },
  ram_capacity: { type: String },
  ram_generation: { type: String },
  storage_type: { type: String },
  operating_system: { type: String },
  usage: { type: String }, 
  weight: { type: String },
  touch_screen: { type: String },
  graphics_type: { type: String },
  graphics_generation: { type: String },
  graphics_capacity: { type: String },
  product_images: { data: Buffer, contentType: String, enum: ['image/jpeg'] },
  product_color: { type: String },
  product_listed: { type: String },
  customer_ratings: { type: Number },
  isDeleted: { type : Boolean },
  coupon: { type: Schema.Types.ObjectId, ref: 'Coupon'}
} );

// Create productDetailsModel
export const products = mongoose.model( 'products', productDetailsSchema );

