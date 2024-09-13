import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

// Get access token from PayPal
const getPayPalAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
    ).toString("base64");
    const response = await axios({
      url: `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      data: `grant_type=client_credentials`,
    });
    return response.data.access_token;
  } catch (error) {
    console.error(`Something Went while getting Paypal Access Token:`, error);
  }
};

// Create a PayPal order
export const createPayPalOrder = async (amount) => {
  try {
    const accessToken = await getPayPalAccessToken();
    const response = await axios({
      url: `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
      method: "post",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      data: {
        intent: "CAPTURE", // Use "CAPTURE" for payment capture intent
        purchase_units: [
          {
            amount: {
              currency_code: "USD", // Ensure the currency code is valid
              value: amount.toFixed(2), // Format the amount to 2 decimal places
            },
          },
        ],
        application_context: {
          return_url: "http://localhost:3000/user/orderPage",
          cancel_url: "http://localhost:3000/user/checkOutPage",
        },
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Something happened while creating PayPal Order:`, error);
  }
};

// Capture a PayPal Order
export const capturePayPalOrder = async (orderId) => {
  try {
    const accessToken = await getPayPalAccessToken();
    const response = await axios({
      url: `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      method: "post",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Something happe`);
  }
};
