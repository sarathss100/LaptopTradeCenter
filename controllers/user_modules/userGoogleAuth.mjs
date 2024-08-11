// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { userCredentials } from "../../models/userCredentialsModel.mjs";
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

/**
 * Initiates the Google OAuth process by generating an authentication URL and redirecting the user to it.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 *
 * @returns {void} This function does not return a value but redirects the user to the Google authentication URL.
 */
export const googleInitialializer = ( req, res ) => {

    // Create an OAuth2 client with Google Client ID and Secret from session
    const googleClient = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
    );

    // Generate the authentication URL with necessary scopes
    const url = googleClient.generateAuthUrl( {
        access_type: 'offline',
        scope: ['profile', 'email'],
    } );

    // Redirect the user to the Google authentication URL
    res.redirect( url );
};

/**
 * Handles the Google OAuth callback, verifies the token, retrieves user info, and issues JWT tokens.
 * 
 * This asynchronous function processes the callback from Google OAuth, verifies the received ID token,
 * retrieves or creates the user in the database, and issues JWT access and refresh tokens. The tokens are
 * set as HTTP-only cookies for security.
 * 
 * @param {Object} req - The HTTP request object, including the query parameters from the callback.
 * @param {Object} res - The HTTP response object, used to redirect the user after authentication.
 *
 * @returns {Promise<void>} This function does not return a value but redirects the user to the home page.
 *
 * @throws {Error} Logs an error to the console if there is an issue during the authentication process.
 */
export const googleCallback = async ( req, res ) => {

    // Create an OAuth2 client with Google Client ID and Secret from session
    const googleClient = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
    );

    try {
        // Exchange authorization code for tokens
        const { tokens } = await googleClient.getToken( req.query.code );
        googleClient.setCredentials( tokens );

        // Verify the ID token and get the payload
        const ticket = await googleClient.verifyIdToken( {
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        } );

        const payload = ticket.getPayload();
        const userId = payload.sub;

        // Find or create the user in the database
        let user = await userCredentials.findOne( { googleId: userId } );

        if ( !user ) {
            user = await userCredentials.create( {
                googleId: userId,
                first_name: payload.name,
                email: payload.email
            } );
        }

        const authUserId = user._id;

        // Create JWT access and refresh tokens
        const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
        const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

        const accessToken = jwt.sign( { authUserId }, accessTokenSecret, { expiresIn: '5m' } );
        const refreshToken = jwt.sign( { authUserId }, refreshTokenSecret, { expiresIn: '7d' } );

        // Update the user document with the new refresh token
        await userCredentials.updateOne( { _id: user._id }, { $set: { refreshToken: refreshToken } } );

        // Set the tokens as HTTP-only cookies
        res.cookie( 'accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        } );
        res.cookie( 'refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        } );

        // Redirect the user to the home page after successful authentication
        res.redirect( '/user/homePage' );

    } catch ( error ) {
        // Log the error message to the console for debugging purposes
        console.error( 'Error during Google authentication', error );

        // Redirect the user to the login page if an error occurs
        res.redirect( 'loginPage' );
    }
};
