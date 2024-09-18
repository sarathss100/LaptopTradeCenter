import mongoose, { Schema } from "mongoose";

// Define brand Category Schema
const paypalOrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: String, required: true }, // PayPal Order ID
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Create brandsModel
export const PayPalOrder = mongoose.model("PayPalOrder", paypalOrderSchema);
