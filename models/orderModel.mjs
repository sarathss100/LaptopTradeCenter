import mongoose, { Schema } from "mongoose";

// Define orderSchema
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "userCredentials",
      required: true,
    },
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "products",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        orderStatus: {
          type: String,
          enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
          default: "Pending",
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    discountDeduction: {
      type: Number,
      required: true,
      default: 0,
    },
    couponDeduction: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMode: {
      type: String,
      enum: ["wallet", "upi", "cod"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    shippingAddress: {
      address_line_1: { type: String },
      address_line_2: { type: String },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zip_code: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Create orderModel
export const Order = mongoose.model("Order", orderSchema);
