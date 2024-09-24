import dotenv from "dotenv";
dotenv.config();
import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { brands as brand } from "../../models/brandModel.mjs";
import { Cart } from "../../models/cartModel.mjs";
import {
  createPayPalOrder,
  capturePayPalOrder,
} from "../../services/paypal.mjs";
import { Wallet } from "../../models/walletModel.mjs";
import { products as productsList } from "../../models/productDetailsModel.mjs";
import { Order } from "../../models/orderModel.mjs";

/**
 * Renders the user's cart page.
 * This function handles the request to display the user's shopping cart and brand information.
 *
 * @param {Object} req - The request object containing HTTP request details.
 * @param {Object} res - The response object used to send HTTP responses.
 *
 * @returns {Promise<void>} - A promise that resolves to undefined when the rendering is complete.
 */

export const userCheckOutPage = async (req, res) => {
  try {
    const { subtotal, discounts, gst, couponDeduction } = req.query;

    const billSummary = {
      subtotal: Number(subtotal),
      discount: Number(discounts) - (Number(couponDeduction) || 0),
      couponDeduction: Number(couponDeduction) || 0,
      gst: Number(gst),
    };

    billSummary.grandTotal =
      billSummary.subtotal -
      (billSummary.discount + billSummary.couponDeduction) +
      billSummary.gst;

    const cartId = req.params.id;

    const paypalClientId = process.env.PAYPAL_CLIENT_ID;

    const cart = await Cart.findOne({ _id: cartId });

    const products = cart.products.map((product) => product);

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false });

    if (req.user) {
      // If the user is authenticated, retrieve user details from the database
      const userId = req.user.userId;
      const user = await userCredentials.findOne({ _id: userId });

      const wallet = await Wallet.findOne({ userId });
      const walletBalance = wallet.balance.toFixed(2);

      // Get the username from the user details
      const username = user.first_name;

      // Render the cart page with the user's username and available brands
      res.render("user/checkOutPage", {
        username,
        brands,
        user,
        billSummary,
        cart,
        products,
        paypalClientId,
        walletBalance,
      });
    }
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Failed to fetch brand names for userCartPage:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Failed to render the cart page");
  }
};

// Create PayPal order route
export const createOrder = async (req, res) => {
  try {
    const { totalAmount } = req.body; // Get the total amount from the request body
    const order = await createPayPalOrder(totalAmount);
    res.json(order);
  } catch (error) {
    console.error(`Error creating PayPal order in route:`, error);
    res.status(500).send(`Failed to create PayPal order`);
  }
};

// Capture PayPal order route
export const captureOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const captureResult = await capturePayPalOrder(orderId);

    res.json(captureResult);
  } catch (error) {
    console.error(`Error capturing PayPal order in route:`, error);
    res.status(500).send(`Failed to capture PayPal order`);
  }
};

export const walletCheckOut = async function (req, res) {
  try {
    const { address, paymentMethod, billSummary, products } = req.body;
    const userId = req.user.userId;
    let paymentStatus = "Paid";
    let orderStatus = "Pending";

    const totalAmount = Number(billSummary.grandTotal);
    const paymentMode = paymentMethod;

    const orderProducts = products.map((product) => ({
      product: product.productId,
      quantity: product.quantity,
      price: product.price,
      orderStatus,
    }));

    if (orderProducts) {
      for (let i = 0; i < orderProducts.length; i++) {
        const product = await productsList.findById(orderProducts[i].product);

        // Check if the product has enough stock
        if (product.product_quantity >= orderProducts[i].quantity) {
          // Reduce the quantity
          await productsList.findByIdAndUpdate(
            { _id: orderProducts[i].product },
            { $inc: { product_quantity: -orderProducts[i].quantity } },
            { new: true }
          );
        } else {
          console.error(`Insufficient stock for product:`);
        }
      }
    }

    const shippingAddress = address;
    const discountDeduction = billSummary.discount;
    const couponDeduction = billSummary.couponDeduction;

    // Process the order here, such as saving it to the database or performing payment operations
    const newOrder = new Order({
      user: userId,
      products: orderProducts,
      totalAmount,
      discountDeduction,
      couponDeduction,
      paymentMode,
      paymentStatus,
      orderStatus,
      shippingAddress,
    });

    // Save the new order to the database
    const saveOrder = await newOrder.save();

    const wallet = await Wallet.findOne({ userId });

    if (wallet) {
      wallet.balance -= totalAmount;
      wallet.transactionHistory.push({
        amount: totalAmount,
        type: "debit",
        description: "Payment for order",
      });

      await wallet.save();
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          products: [],
          totalAmount: 0,
        },
      },
      { new: true }
    );

    // Respond with the saved order
    res.status(201).json({ success: true, order: saveOrder });
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Something happened while creating wallet checkout:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};
