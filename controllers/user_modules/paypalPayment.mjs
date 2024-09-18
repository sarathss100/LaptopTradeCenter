// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

import { client as paypalClient } from "../../config/paypalConfig.mjs";
import { Wallet } from "../../models/walletModel.mjs";
import paypal from "@paypal/checkout-server-sdk";
import { PayPalOrder } from "../../models/paypalOrderModel.mjs";
import axios from "axios";

// Fetch conversion rate from INR to USD
const getConversionRate = async () => {
  try {
    const response = await axios.get(
      "https://api.exchangerate-api.com/v4/latest/INR"
    );
    return response.data.rates.USD;
  } catch (error) {
    console.error("Error fetching conversion rate:", error);
    throw new Error("Failed to fetch conversion rate");
  }
};

// Create PayPal order for adding funds
export const addFundPayPalOrder = async function (req, res) {
  try {
    const { amount } = req.body;

    const userId = req.user.userId;
    const { accessToken, refreshToken } = req.cookies;

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: amount },
        },
      ],
      application_context: {
        return_url: `http://localhost:3000/user/wallet/success`,
        cancel_url: "http://localhost:3000/user/wallet/cancel",
      },
    });

    try {
      const order = await paypalClient.execute(request);

      // Save the PayPal order ID and user ID in the database
      const newPayPalOrder = new PayPalOrder({
        userId, // Save the authenticated user ID
        orderId: order.result.id, // Save the PayPal order ID
        accessToken,
        refreshToken,
      });

      await newPayPalOrder.save();

      res.json({ id: order.result.id });
    } catch (error) {
      console.error(`Something went wrong while adding Fund :`, error);
      res.status(500).send(`Error Creating PayPal order`);
    }
  } catch (error) {
    console.error(`Something went wrong while adding Fund :`, error);
    res.status(500).send(`Error Creating PayPal order`);
  }
};

export const walletSuccess = async function (req, res) {
  const { token } = req.query; // 'token' is the PayPal order ID

  const request = new paypal.orders.OrdersCaptureRequest(token);
  request.requestBody({});

  try {
    const capture = await paypalClient.execute(request);

    const amount =
      capture.result.purchase_units[0].payments.captures[0].amount.value;
    const conversionRate = await getConversionRate();

    const amountInINR = (amount / conversionRate).toFixed(2);

    // Find the userId based on the PayPal order ID
    const paypalOrder = await PayPalOrder.findOne({ orderId: token });
    if (!paypalOrder) {
      return res.status(404).send("Order not found");
    }
    const userId = paypalOrder.userId;
    const accessToken = paypalOrder.accessToken;
    const refreshToken = paypalOrder.refreshToken;

    // const userId = req.user.userId; // Assuming user is authenticated
    const wallet = await Wallet.findOne({ userId });

    // Update wallet balance
    wallet.balance += parseFloat(amountInINR);
    wallet.transactionHistory.push({
      amount: parseFloat(amountInINR),
      type: "credit",
      description: "Added funds via PayPal",
    });
    await wallet.save();
    await PayPalOrder.deleteOne({ orderId: token });

    // Set the JWT access token as an HTTP-only cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
    });

    // Set the JWT refresh token as an HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
    });

    res.redirect("/user/couponPage");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error capturing PayPal payment");
  }
};

export const walletCancel = async function (req, res) {
  const { token } = req.query;
  // Find the userId based on the PayPal order ID
  const paypalOrder = await PayPalOrder.findOne({ orderId: token });
  if (!paypalOrder) {
    return res.status(404).send("Order not found");
  }
  const userId = paypalOrder.userId;
  const accessToken = paypalOrder.accessToken;
  const refreshToken = paypalOrder.refreshToken;
  await PayPalOrder.deleteOne({ orderId: token });

  // Set the JWT access token as an HTTP-only cookie
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
  });

  // Set the JWT refresh token as an HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
  });

  res.redirect("/user/couponPage");
};

export const walletCheckOut = async function (req, res) {
  const { orderTotal } = req.body;

  // Find the userId based on the PayPal order ID
  const paypalOrder = await PayPalOrder.findOne({ orderId: token });
  if (!paypalOrder) {
    return res.status(404).send("Order not found");
  }
  const userId = paypalOrder.userId;

  const wallet = await Wallet.findOne({ userId });

  if (wallet && wallet.balance >= orderTotal) {
    wallet.balance -= orderTotal;
    wallet.transactionHistory.push({
      amount: orderTotal,
      type: "debit",
      description: "Payment for order",
    });
    await wallet.save();

    await PayPalOrder.deleteOne({ orderId: token });

    res.json({ message: "Order paid with wallet successfully!" });
  } else {
    res.json({ message: "Insufficient wallet balance" });
  }
};
