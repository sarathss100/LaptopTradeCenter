import dotenv from "dotenv";
dotenv.config();
import Decimal from "decimal.js";
import axios from "axios";

// Function to get the pre-calculated USD amount from INR
async function getConvertedAmount(amountInINR) {
  const apiKey = "a11a944bc0fa97770d466416"; // Replace with your actual API key
  const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/INR/USD/${amountInINR}`;

  try {
    const response = await axios.get(apiUrl);
    const conversionRate = new Decimal(response.data.conversion_rate);
    const amountUSD = new Decimal(amountInINR)
      .mul(conversionRate)
      .toDecimalPlaces(2);
    return amountUSD; // Returns a string with two decimal places
  } catch (error) {
    console.error("Error fetching conversion amount:", error);
    throw new Error("Failed to convert INR to USD.");
  }
}

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
    console.error(
      `Error getting PayPal Access Token:`,
      error.response ? error.response.data : error
    );
    throw new Error("Failed to get PayPal Access Token");
  }
};

// Create a PayPal order
export const createPayPalOrder = async (amount) => {
  try {
    const amountInUSD = await getConvertedAmount(amount);

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
              value: amountInUSD.toFixed(2), // Format the amount to 2 decimal places
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
    throw new Error("Failed to create PayPal order");
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
    console.error(`Something happened while capture paypal order`, error);
  }
};
