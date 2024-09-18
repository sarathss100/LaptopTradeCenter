import mongoose, { Schema } from "mongoose";

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  balance: { type: Number, default: 0 },
  transactionHistory: [
    {
      amount: { type: Number, required: true },
      type: { type: String, required: true },
      description: { type: String, required: true },
      date: { type: Date, default: Date.now }, // Optional: Add a timestamp for the transaction
    },
  ],
});

export const Wallet = mongoose.model("Wallet", walletSchema);
