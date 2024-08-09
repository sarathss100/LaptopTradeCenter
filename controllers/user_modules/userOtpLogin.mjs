// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { userCredentialsModel } from '../../models/mongodb.mjs';
import { authenticator } from 'otplib';

// Function to validate email format using regex
const isValidEmail = ( email ) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( email );

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
export const otpGeneratingPage = ( req, res ) => {
    try {
        // Retrieve any stored error messages related to OTP generation from the session
        const userOtpLoginCredentialsError = req.session.userOtpLoginCredentialsError || '';
        
        // Clear the error messages related to OTP generation from the session
        req.session.userOtpLoginCredentialsError = '';

        // Retrieve the stored email from the session
        const email = req.session.email || '';

        // Render the OTP generation page with the retrieved error messages and email
        res.render( 'user/userOtpGeneratePage', { userOtpLoginCredentialsError, email } );
    } catch ( error ) {
        // Log any errors that occur during the rendering process
        console.error( 'Failed to render the OTP generating page:', error );

        // Send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render the OTP generating page' );
    }
};


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
export const generateOTP = async ( req, res ) => {
    try {
        const { email } = req.body;
        req.session.email = email; // Store the email in the session

        // Validate the email format
        const ValidEmail = isValidEmail( email );
        if ( !email || !ValidEmail ) {
            req.session.userOtpLoginCredentialsError = 'Please enter a valid email to generate OTP';
            return res.redirect( 'generateOTPPage' ); // Redirect to the OTP generation page if email is invalid
        }

        // Fetch user credentials from the database
        const user = await userCredentialsModel.findOne( { email } );
        if ( !user ) {
            req.session.userOtpLoginCredentialsError = `Account doesn't exist`;
            return res.redirect( 'generateOTPPage' ); // Redirect if the user is not found
        }

        if ( user.isBlocked === 'Blocked' ) {
            req.session.userOtpLoginCredentialsError = `Account Blocked`;
            return res.redirect( 'generateOTPPage' ); // Redirect if the account is blocked
        }

        // Configure the email transporter
        const transporter = nodemailer.createTransport( {
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        } );

        // Generate OTP using otplib
        const otp = authenticator.generate( process.env.SESSION_SECRET );
        const time = Date.now() + 60000; // OTP expires in 1 minute

        // Store the OTP and its expiration time in the user's database record
        await userCredentialsModel.updateOne( { email }, { otp, otpExpires: time } );

        // Email options for sending the OTP
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}`
        };

        // Send the OTP email
        transporter.sendMail( mailOptions, ( error, info ) => {
            if ( error ) {
                return res.status( 500 ).send( 'Failed to send OTP' ); // Handle email sending errors
            }
            res.redirect( 'verifyOTPPage' ); // Redirect to the OTP verification page
        });
    } catch ( error ) {
        console.error( 'Something went wrong while generating OTP', error ); // Log errors during OTP generation
    }
};

/**
 * Renders the OTP verification page.
 * 
 * This asynchronous function handles rendering the OTP verification page for users. It retrieves any potential error messages
 * and the user's email from the session, clears the error messages, and then renders the OTP verification page. If an error occurs
 * while rendering the page, it logs the error and sends a 500 Internal Server Error response.
 * 
 * @param {Object} req - The HTTP request object containing details of the HTTP request.
 * @param {Object} res - The HTTP response object used to send responses to the client.
 * 
 * @returns {void} This function does not return a value but renders the OTP verification page view or sends an error message.
 * 
 * @throws {Error} Logs an error to the console if there is an issue rendering the OTP verification page.
 */
export const otpVerificationPage = ( req, res ) => {
    try {
        // Retrieve any stored error messages related to OTP verification from the session
        const userOtpLoginCredentialsError = req.session.userOtpLoginCredentialsError || '';
        
        // Clear the error messages related to OTP verification from the session
        req.session.userOtpLoginCredentialsError = '';

        // Retrieve the stored email from the session
        const email = req.session.email || '';

        // Render the OTP verification page with the retrieved error messages and email
        res.render( 'user/userOtpVerifyPage', { userOtpLoginCredentialsError, email } );
    } catch ( error ) {
        // Log any errors that occur during the rendering process
        console.error( 'Failed to render the OTP verification page:', error );

        // Send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render the OTP verification page' );
    }
};


/**
 * Verifies the OTP and logs in the user if the OTP is valid.
 * 
 * This asynchronous function checks if the provided OTP matches the one stored in the database and is still valid.
 * If the OTP is valid, it generates JWT access and refresh tokens, updates the user's record, and sets the tokens as cookies.
 * 
 * @param {Object} req - The HTTP request object containing the OTP and email in the request body.
 * @param {Object} res - The HTTP response object used to send responses to the client.
 * 
 * @returns {Promise<void>} This function does not return a value but redirects the user based on the result of OTP verification.
 * 
 * @throws {Error} Logs an error to the console if there is an issue during OTP verification or token generation.
 */
export const verifyOTP = async ( req, res ) => {
    const { otp, email } = req.body;

    // Fetch user credentials from the database
    const user = await userCredentialsModel.findOne( { email } );

    // Retrieve JWT secret keys from session
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    if ( !otp ) {
        req.session.userOtpLoginCredentialsError = 'Valid OTP required';
        return res.redirect( 'verifyOTPPage' ); // Redirect if OTP is not provided
    }

    // Check if the OTP is valid and not expired
    if ( user.otp && user.otpExpires > Date.now() ) {
        if ( Number( otp ) === user.otp ) {
            // Clear OTP from the database after successful verification
            await userCredentialsModel.updateOne( { '_id': user.id }, { otp: '', otpExpires: '' } );

            const userId = user.id;
            req.userId = userId;

            // Generate JWT access and refresh tokens
            const accessToken = jwt.sign( { userId }, accessTokenSecret, { expiresIn: '5m' } );
            const refreshToken = jwt.sign( { userId }, refreshTokenSecret, { expiresIn: '7d' } );

            // Store the refresh token in the user's database record
            await userCredentialsModel.updateOne( { '_id': userId }, { refreshToken, otp: '', otpExpires: '' } );

            // Set JWT tokens as HTTP-only cookies
            res.cookie( 'accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' } );
            res.cookie( 'refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' } );

            // Redirect to the home page after successful login
            res.redirect( 'homePage' );
        }
    } else {
        req.session.userOtpLoginCredentialsError = 'Valid OTP required';
        res.redirect( 'verifyOTPPage' ); // Redirect if OTP is invalid or expired
    }
};
