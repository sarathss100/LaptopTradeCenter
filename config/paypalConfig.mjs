import dotenv from "dotenv";
dotenv.config();

// Configure PayPal environment with client credentials
const environment = function () {
  let clientId = process.env.PAYPAL_CLIENT_ID;
  let clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  return new paypal.core.SandboxEnvironment(clientId, clientSecret); // For sandbox
  // return new paypal.core.LiveEnvironment(clientId, clientSecret);  // For live
};

const client = function () {
  return new paypal.core.PayPalHttpClient(environment());
};
