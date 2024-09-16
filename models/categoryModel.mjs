import mongoose, { Schema } from "mongoose";

// Define categorySchema
const categorySchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: true,
  },
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
  ],
  isBlocked: { type: Boolean, default: false },
  created_date: { type: Date, default: Date.now },
});

// Create categoryModel
export const Category = mongoose.model("Category", categorySchema);
