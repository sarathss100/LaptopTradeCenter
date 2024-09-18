import dotenv from "dotenv";
dotenv.config();
import paypal from "@paypal/checkout-server-sdk";

// Configure the PayPal environment
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

export { client };
