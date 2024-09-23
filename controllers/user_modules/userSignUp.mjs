// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { userCredentials } from "../../models/userCredentialsModel.mjs";
import validator from "validator";
import { products as productList } from "../../models/productDetailsModel.mjs";
import { brands as brand } from "../../models/brandModel.mjs";
import nodemailer from "nodemailer";
import { authenticator } from "otplib";

// Function to validate email format using regex
const isValidEmail = (email) => validator.isEmail(email);

// Function to validate phone number format using regex
const isValidPhoneNumber = (phoneNumber) => {
  const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
  return phoneRegex.test(phoneNumber);
};

// Function create random referal code
const generateReferralCode = function (length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let referralCode = "";
  for (let i = 0; i < length; i++) {
    referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return referralCode;
};

/**
 * Renders the user sign-up page.
 *
 * This asynchronous function attempts to render the user sign-up page. If an error occurs during rendering,
 * it logs the error and sends a 500 Internal Server Error response.
 *
 * @param {Object} req - The HTTP request object containing details of the HTTP request.
 * @param {Object} res - The HTTP response object used to send responses to the client.
 *
 * @returns {Promise<void>} This function does not return a value but renders the user sign-up page view or sends an error message.
 *
 * @throws {Error} Logs an error to the console if there is an issue rendering the sign-up page.
 */
export const signUpPage = async (req, res) => {
  try {
    // Fetch all product details from the database
    const products = await productList.find({});

    const brands = await brand.find({ isBlocked: false });

    // Initialize an empty string for user login credentials error messages
    const emailFormatError = req.session.userSignupEmailFormatError || "";
    const phoneNumberFormatError = req.session.userPhoneNumberFormatError || "";
    const passwordMissMatchError = req.session.userPasswordMissMatchError || "";

    // Clear the session error message after retrieval to ensure it's not reused
    req.session.userSignupEmailFormatError = "";
    req.session.userPhoneNumberFormatError = "";
    req.session.userPasswordMissMatchError = "";

    // Render the sign-up page view with the error string
    res.render("user/userSignUpPage", {
      emailFormatError,
      phoneNumberFormatError,
      passwordMissMatchError,
      username: "Login",
      brands,
      products,
    });
  } catch (error) {
    // Log any errors that occur during rendering
    console.error("Failed to render sign-up page:", error);

    // Send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Failed to render sign-up page");
  }
};

/**
 * Handles the sign-up form submission.
 *
 * This asynchronous function processes the sign-up form submission. It validates the user input, hashes the password,
 * creates a new user record in the database, generates JWT tokens, and sets them as cookies. If any validation errors occur,
 * it renders the sign-up page again with error messages.
 *
 * @param {Object} req - The HTTP request object containing the sign-up form data in the request body.
 * @param {Object} res - The HTTP response object used to send responses to the client.
 *
 * @returns {Promise<void>} This function does not return a value but redirects the user to the home page or renders
 *                          the sign-up page with errors based on the validation result.
 *
 * @throws {Error} Logs an error to the console if there is an issue during user creation or JWT token generation.
 */

export const signUpForm = async (req, res) => {
  const data = req.body;
  const saltRounds = 10;
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString(); // Use ISO format for consistent date storage
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  let userHashedPassword = "";

  // Initialize error messages
  req.session.userSignupEmailFormatError = "";
  req.session.userPhoneNumberFormatError = "";
  req.session.userPasswordMissMatchError = "";

  if (!isValidEmail(data.email))
    req.session.userSignupEmailFormatError = `Please enter a valid email`;

  if (!isValidPhoneNumber(data.phone_number))
    req.session.userPhoneNumberFormatError = `Please enter a valid phone number`;

  if (data.password !== data.confirm_password)
    req.session.userPasswordMissMatchError = `Passwords don't match!`;

  // If there are validation errors, redirect to the sign-up page with errors
  if (
    req.session.userSignupEmailFormatError ||
    req.session.userPhoneNumberFormatError ||
    req.session.userPasswordMissMatchError
  ) {
    return res.redirect("signUpPage");
  }

  // Hash the password using bcrypt
  const salt = await bcrypt.genSalt(saltRounds);
  userHashedPassword = await bcrypt.hash(data.password, salt);

  // Generate a random referal code
  const referalCode = generateReferralCode();

  // Create a new user document
  const newUser = new userCredentials({
    first_name: data.first_name,
    second_name: data.second_name,
    email: data.email,
    phone_number: data.phone_number,
    password: userHashedPassword,
    joined_date: formattedDate,
    status: true,
    referal_code: referalCode,
  });

  try {
    // Save the new user to the database
    const user = await newUser.save();

    const userId = user.id;

    // Store the user ID in the request object
    req.userId = userId;

    // Generate JWT access and refresh tokens
    const accessToken = jwt.sign({ userId }, accessTokenSecret, {
      expiresIn: "5m",
    });
    const refreshToken = jwt.sign({ userId }, refreshTokenSecret, {
      expiresIn: "7d",
    });

    // Update the user document with the new refresh token
    await userCredentials.updateOne(
      { _id: user._id },
      { $set: { refreshToken: refreshToken } }
    );

    // Set the JWT tokens as HTTP-only cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    res.json({ sucess: true });
  } catch (error) {
    // Log any errors that occur during sign-up
    console.error("Failed to signup:", error);

    // Send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Internal Server Error");
  }
};
