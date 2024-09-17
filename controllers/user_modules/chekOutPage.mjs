import dotenv from "dotenv";
dotenv.config();
import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { brands as brand } from "../../models/brandModel.mjs";
import { Cart } from "../../models/cartModel.mjs";
import {
  createPayPalOrder,
  capturePayPalOrder,
} from "../../services/paypal.mjs";

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
    const { subtotal, discounts, gst } = req.query;

    const billSummary = {
      subtotal: Number(subtotal),
      discount: Number(discounts),
      gst: Number(gst),
    };

    billSummary.grandTotal =
      billSummary.subtotal - billSummary.discount + billSummary.gst;

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
