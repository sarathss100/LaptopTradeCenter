// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { authenticator } from "otplib";

// Function to validate email format using regex
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Renders the OTP generation page.
 *
 * This asynchronous function handles rendering the OTP generation page for users. It retrieves any potential error messages
 * and the user's email from the session, clears the error messages, and then renders the OTP generation page. If an error occurs
 * while rendering the page, it logs the error and sends a 500 Internal Server Error response.
 *
 * @param {Object} req - The HTTP request object containing details of the HTTP request.
 * @param {Object} res - The HTTP response object used to send responses to the client.
 *
 * @returns {void} This function does not return a value but renders the OTP generation page view or sends an error message.
 *
 * @throws {Error} Logs an error to the console if there is an issue rendering the OTP generation page.
 */
// export const otpGeneratingPage = ( req, res ) => {
//     try {
//         // Retrieve any stored error messages related to OTP generation from the session
//         const userOtpLoginCredentialsError = req.session.userOtpLoginCredentialsError || '';

//         // Clear the error messages related to OTP generation from the session
//         req.session.userOtpLoginCredentialsError = '';

//         // Retrieve the stored email from the session
//         const email = req.session.email || '';

//         // Render the OTP generation page with the retrieved error messages and email
//         res.render( 'user/userOtpGeneratePage', { userOtpLoginCredentialsError, email } );
//     } catch ( error ) {
//         // Log any errors that occur during the rendering process
//         console.error( 'Failed to render the OTP generating page:', error );

//         // Send a 500 Internal Server Error response if an error occurs
//         res.status( 500 ).send( 'Failed to render the OTP generating page' );
//     }
// };

/**
 * Generates an OTP and sends it to the user's email.
 *
 * This asynchronous function generates a one-time password (OTP) and sends it to the user's email if the email is valid,
 * the user exists, and the account is not blocked. The OTP is stored in the database and an email is sent with the OTP.
 *
 * @param {Object} req - The HTTP request object containing the user's email in the request body.
 * @param {Object} res - The HTTP response object used to send responses to the client.
 *
 * @returns {Promise<void>} This function does not return a value but redirects the user based on the result of OTP generation.
 *
 * @throws {Error} Logs an error to the console if there is an issue generating or sending the OTP.
 */
export const generateOTP = async (req, res) => {
  try {
    const { email } = req.body;
    req.session.email = email; // Store the email in the session

    // Validate the email format
    const ValidEmail = isValidEmail(email);
    if (!email || !ValidEmail) {
      return res
        .status(400)
        .json({ error: "Please enter a valid email to generate OTP" });
    }

    // Fetch user credentials from the database
    const user = await userCredentials.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: `Account doesn't exist` });
    }

    if (user.isBlocked === "Blocked") {
      return res.status(403).json({ error: `Account Blocked` });
    }

    // Configure the email transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Set the number of OTP digits to 4
    authenticator.options = { digits: 4 };

    // Generate OTP using otplib
    const otp = authenticator.generate(process.env.SESSION_SECRET);
    const time = Date.now() + 60000; // OTP expires in 1 minute

    // Store the OTP and its expiration time in the user's database record
    await userCredentials.updateOne({ email }, { otp, otpExpires: time });

    // Email options for sending the OTP
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}`,
    };

    // Send the OTP email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send("Failed to send OTP"); // Handle email sending errors
      }
      return res.status(200).json({ message: "OTP sent successfully" });
    });
  } catch (error) {
    console.error("Something went wrong while generating OTP", error);
    return res
      .status(500)
      .json({ error: "An error occurred. Please try again later." });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { otp, email } = req.body;

    // Validate input
    if (!otp || !email) {
      return res.status(400).json({ 
        success: false, 
        error: "OTP and email are required" 
      });
    }

    // Fetch user credentials from the database
    const user = await userCredentials.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    // Check if user is blocked
    if (user.isBlocked === "Blocked") {
      return res.status(403).json({ 
        success: false, 
        error: "Account is blocked" 
      });
    }

    // Retrieve JWT secret keys
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    // Check if the OTP exists and is not expired
    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ 
        success: false, 
        error: "No valid OTP found. Please generate a new OTP." 
      });
    }

    if (user.otpExpires <= Date.now()) {
      // OTP has expired, clear it from database
      await userCredentials.updateOne(
        { _id: user._id },
        { otp: null, otpExpires: null }
      );
      return res.status(400).json({ 
        success: false, 
        error: "OTP has expired. Please generate a new OTP." 
      });
    }

    // Verify the OTP
    if (Number(otp) !== user.otp) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid OTP" 
      });
    }

    // OTP is valid - proceed with login
    const userId = user._id; // Use _id instead of id for MongoDB

    // Generate JWT access and refresh tokens
    const accessToken = jwt.sign({ userId }, accessTokenSecret, {
      expiresIn: "5m",
    });
    const refreshToken = jwt.sign({ userId }, refreshTokenSecret, {
      expiresIn: "7d",
    });

    // Store the refresh token and clear OTP from the user's database record
    await userCredentials.updateOne(
      { _id: userId },
      { 
        refreshToken, 
        otp: null, 
        otpExpires: null 
      }
    );

    // Set JWT tokens as HTTP-only cookies
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

    return res.json({ 
      success: true, 
      message: "Login successful" 
    });

  } catch (error) {
    console.error("Error during OTP verification:", error);
    return res.status(500).json({ 
      success: false, 
      error: "An error occurred during OTP verification" 
    });
  }
};

export const otpExpired = async (req, res) => {
  try {
    const { email } = req.body;

    // Perform OTP removal logic based on email here
    if (email) {
      // Find and remove the OTP associated with the email
      const result = await userCredentials.updateOne({ email }, { otp: null });
      if (result) {
        return res.json({ success: true, message: "OTP expired and removed." });
      } else {
        return res.json({ success: false, message: "No OTP found to delete." });
      }
    }
  } catch (error) {
    console.error("Error expiring OTP:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
