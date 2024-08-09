// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import * as collection from '../../models/mongodb.mjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';

// Function to validate email format using regex
const isValidEmail = ( email ) => validator.isEmail( email );

/**
 * Renders the login page or redirects to the dashboard if already authenticated.
 * 
 * This function checks if there are any authentication error messages stored in the session and renders
 * the login page with those error messages if present. It also clears the error messages from the session
 * after they have been retrieved.
 * 
 * @param {Object} req - The Express request object containing details of the HTTP request, including session data.
 * @param {Object} res - The Express response object used to send HTTP responses, including rendering views or redirection.
 * 
 * @returns {void} This function does not return a value but renders the login page view with any error messages.
 * 
 * @throws {Error} Logs an error to the console if there is an issue rendering the login page, and sends a 500 Internal Server Error response.
 */
export const loginPage = ( req, res ) => {
    try {
        // Retrieve any authentication error message from the session, defaulting to an empty string if not present
        const emailFormatError = req.session.adminEmailFormatError || '';
        const falseEmailError = req.session.adminFalseEmailError || '';
        const falsePasswordError = req.session.adminFalsePasswordError || '';
        
        // Clear the error message from the session after retrieval
        req.session.adminEmailFormatError = '';
        req.session.adminFalseEmailError = '';
        req.session.adminFalsePasswordError = '';

        // Render the login page, passing any retrieved error messages to the view
        res.render( 'admin/adminLoginPage', { emailFormatError, falseEmailError, falsePasswordError } );
    } catch ( error ) {
        // Log any errors that occur during rendering
        console.error( 'Failed to render the login page:', error );

        // Send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render the login page' );
    }
};

/**
 * Handle the login form submission, authenticate the user, and issue a JWT token.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export const loginForm = async ( req, res, next ) => {
    // Extract email and password from the request body
    const { email, password } = req.body;
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    const saltRounds = 10;

    try {

        req.session.adminEmailFormatError = '';
        req.session.adminFalseEmailError = '';
        req.session.adminFalsePasswordError = '';

        if ( !isValidEmail( email ) ) {
            req.session.adminEmailFormatError = `Please enter a valid email`;
            return res.redirect( 'loginPage' );
        }

        // Fetch the admin's credentials from the database
        const admin = await collection.adminCredentialsModel.findOne( { email } );

        // Check if the admin exists
        if ( !admin ) {
            req.session.adminFalseEmailError = 'Please enter a valid Email';
            return res.redirect( 'loginPage' );
        }

        // Compare the provided password with the stored hash
        const isValidAdmin = await bcrypt.compare( password, admin.password );

        // Check if the password is valid
        if ( !isValidAdmin ) {
            req.session.adminFalsePasswordError = 'Please enter a valid Password';
            return res.redirect( 'loginPage' );
        }

        // Generate a salt for hashing passwords using bcrypt.
        const salt = await bcrypt.genSalt( saltRounds );

        // Hash the administrator's ID using bcrypt with the provided salt.
        // The hashed ID is used for generate a JWT token, ensuring that the raw ID is not exposed.
        const adminId = await bcrypt.hash( admin.id, salt );
        
        // Storing adminId in request
        req.adminId = adminId;

        // Generate a JWT access token for the authenticated admin
        const accessToken = jwt.sign( { adminId }, accessTokenSecret, { expiresIn: '1m' } );

        // Generate a JWT access token for the authenticated admin
        const refreshToken = jwt.sign( { adminId }, refreshTokenSecret, { expiresIn: '7d' } );

        await collection.adminRefreshTokenModel.insertMany( { refreshToken } );

        // Set the JWT access token as an HTTP-only cookie
        res.cookie( 'accessToken', accessToken, { httpOnly: true, secure: process.env.NODE === 'production', sameSite: 'Strict' } );

        // Set the JWT refresh token as an HTTP-only cookie
        res.cookie( 'refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE === 'production', sameSite: 'Strict' } );

        // Redirect to the dashboard after successful login
        res.redirect( 'dashboard' );
    } catch ( error ) {
        // Log any errors that occur during authentication
        console.error( 'Authentication failed:', error );
        next( error ); 
    }
};


