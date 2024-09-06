import axios from "axios";
import qs from "qs";
import dotenv from "dotenv";
dotenv.config();

const generateAccessToken = async () => {
  try {
    const response = await axios({
      url: `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
      method: "post",
      data: qs.stringify({ grant_type: "client_credentials" }),
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_SECRET,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.log(error);
  }
};

export const createOrder = async () => {
  const accessToken = await generateAccessToken();

  const response = await axios({
    url: `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer" + accessToken,
    },
    data: JSON.stringify({}),
  });
};
