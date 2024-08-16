// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { userCredentials } from "../../models/userCredentialsModel.mjs";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';

// Function to validate email format using regex
const isValidEmail = ( email ) => validator.isEmail( email );

/**
 * Renders the login page.
 * 
 * This function retrieves any login error messages stored in the session, clears the session error, 
 * and renders the login page with the error message (if any).
 * 
 * @param {Object} req - The HTTP request object containing session details.
 * @param {Object} res - The HTTP response object used to render the login page.
 */
export const loginPage = async ( req, res ) => {
    try {

        // Retrieve any error message related to login credentials from the session
        const userLoginCredentialsError = req.session.userLoginCredentialsError || '';
        const EmailFormatError = req.session.userLoginCredentialsEmailFormatError || '';

        // Clear the session error message after retrieval to ensure it's not reused
        req.session.userLoginCredentialsError = '';
        req.session.userLoginCredentialsEmailFormatError = '';
        
        // Render the login page view with the error message, if any
        res.render( 'user/userLoginPage', { userLoginCredentialsError, EmailFormatError } );
    } catch ( error ) {
        // Log any errors that occur during the rendering process
        console.error( 'Failed to render the login page:', error );

        // Send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render the login page' );
    }
};

/**
 * Handles the login form submission.
 * 
 * This asynchronous function processes the login form submission by verifying the user's email and password,
 * generating JWT access and refresh tokens, and setting them as HTTP-only cookies. If the user is blocked or
 * the credentials are invalid, it redirects back to the login page with an error message.
 * 
 * @param {Object} req - The HTTP request object containing the login form data.
 * @param {Object} res - The HTTP response object used to redirect or render responses.
 * @param {Function} next - The next middleware function in the Express.js stack.
 * 
 * @returns {Promise<void>} This function does not return a value but redirects or renders responses.
 * 
 * @throws {Error} Logs an error to the console if there is an issue during authentication.
 */
export const loginForm = async ( req, res, next ) => {
    // Extract email and password from the request body
    const { email, password } = req.body;
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    try {

        // Check if the email is in valid format
        if ( !isValidEmail( email ) ) {
            req.session.userLoginCredentialsEmailFormatError = 'Please enter a valid email';
            return res.redirect( 'loginPage' );
        }

        // Fetch the user's credentials from the database
        const user = await userCredentials.findOne( { email } );

        // Check if the user exists
        if ( !user ) {
            req.session.userLoginCredentialsError = `User doesn't exist! Please sign up`;
            return res.redirect( 'loginPage' );
        }

        // Check if the user is blocked
        if ( user.isBlocked === 'Blocked' ) {
            req.session.userLoginCredentialsError = 'You are blocked from using the service';
            return res.redirect( 'loginPage' );
        }

        // Compare the provided password with the stored hash
        const isValidUser = await bcrypt.compare( password, user.password );

        // Check if the password is valid
        if ( !isValidUser ) {
            req.session.userLoginCredentialsError = 'Please enter the correct password';
            return res.redirect('loginPage');
        }

        const userId = user.id;

        // Storing userId in request
        req.userId = userId;

        // Generate a JWT access token for the authenticated user
        const accessToken = jwt.sign( { userId }, accessTokenSecret, { expiresIn: '2m' } );

        // Generate a JWT refresh token for the authenticated user
        const refreshToken = jwt.sign( { userId }, refreshTokenSecret, { expiresIn: '7d' } );

        // Update the user's refresh token in the database
        await userCredentials.updateOne( { '_id': userId }, { 'refreshToken': refreshToken, isDeleted: false } );

        // Set the JWT access token as an HTTP-only cookie
        res.cookie( 'accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' } );

        // Set the JWT refresh token as an HTTP-only cookie
        res.cookie( 'refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' } );

        // Redirect to the home page after successful login
        res.redirect( 'homePage' );
    } catch ( error ) {
        // Log any errors that occur during authentication
        console.error( 'Authentication failed:', error );
        next( error ); 
    }
};