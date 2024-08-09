// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { userCredentialsModel } from '../models/mongodb.mjs';
import jwt, { decode } from 'jsonwebtoken';

/**
 * Middleware to authenticate user based on JWT access token and manage session.
 * This middleware handles token verification and refresh token handling.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const userAuthenticator = async ( req, res, next ) => {
    
    // Extract the access token from cookies
    const token = req.cookies[ 'accessToken' ];
    // Retrieve secrets for JWT verification from session
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    /**
     * Handles refresh token verification and issuing new access tokens.
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} res - Express response object
     */
    const refreshTokenHandler = async ( req, res ) => {
        const refreshToken = req.cookies[ 'refreshToken' ];

        // Check if refresh token is provided
        if ( !refreshToken ) {
            return res.status( 401 ).json( { message: 'No refresh token provided' } );
        }

        try {
            // Verify the refresh token
            const decoded = jwt.verify( refreshToken, refreshTokenSecret );
            const userId = decoded.userId;
            const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

            // Find user with the provided refresh token
            const user = await userCredentialsModel.find( { '_id' : userId } );

            // If user is not found or refresh token doesn't match, return error
            if ( !user || user[0].refreshToken !== refreshToken ) {
                return res.status( 403 ).json( { message: 'Invalid refresh token' } );
            }

            const isBlocked = user[0].isBlocked === 'Blocked';

            if ( isBlocked ) {
                try {
                    // Attempt to find and delete the refresh token from the database
                    await userCredentialsModel.updateOne( { '_id': userId },{ refreshToken : '', googleId : '' } );
                } catch ( error ) {
                    // Log the error if the refresh token removal fails
                    console.error( `Failed to remove refresh token:`, error );
                }

                // Clear the access token cookie by setting its expiration date to a past date
                res.cookie( 'accessToken', '', { httpOnly: true, expires: new Date( 0 ) } );
                // Clear the refresh token cookie by setting its expiration date to a past date
                res.cookie( 'refreshToken', '', { httpOnly: true, expires: new Date( 0 ) } );
                // Clear the refresh token cookie by setting its expiration date to a past date
                res.cookie( 'googleIdToken', '', { httpOnly: true, expires: new Date( 0 ) } );

                // Destroying session
                req.session.destroy( ( error ) => {
                    if ( error ) {
                        console.log( `Failed to destroy the session:`, error );
                    }
                } );

                // Redirect the user to the login page after successfully destroying the session
                return res.redirect( 'loginPage' );
            }

            // Generate a new access token
            const newAccessToken = jwt.sign( { 'userId' : userId }, accessTokenSecret, { expiresIn: '2m' } );

            // Set the new access token in cookies
            res.cookie( 'accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict'
            } );

            // Redirect to the original request URL
            return res.redirect( req.originalUrl );

        } catch ( error ) {
            return res.status( 403 ).json( { message: 'Invalid refresh token' } );
        }
    };

    // If no access token, allow requests to certain routes without authentication
    if ( !token ) {
        const allowedRoutes = [
            '/loginPage', '/generateOTPPage', '/generateOTP', '/auth/google', 
            '/auth/google/callback', '/verifyOTPPage', '/verifyOTP', '/loginForm', 
            '/signUpPage', '/signUpForm', '/homePage', '/passwordResetPage', 
            '/passwordResetForm', '/otpLoginPage', '/filterPage'
        ];
        if ( allowedRoutes.includes( req.path )) {
            return next();
        } else {
            return res.redirect( 'loginPage' );
        }
    };

    // If access token is provided and the request path is not login or sign-up
    if ( token && req.path !== '/loginPage' && req.path !== '/signUpPage' ) {
        // Verify the access token
        jwt.verify( token, secret, async ( error, decoded ) => {

            if ( error ) {
                // If token is expired, handle refresh token process
                if ( error.name === 'TokenExpiredError' ) {
                    return refreshTokenHandler( req, res );
                }
                return res.status( 401 ).json( { message: 'Unauthorized access' } );
            }
            
            // Set the decoded user information in the request object
            req.user = decoded;
            const userId = decoded.userId;

            const user = await userCredentialsModel.find( { '_id' : userId } );
            const isBlocked = user[0].isBlocked === 'Blocked';

            if ( isBlocked ) {
                try {
                    // Attempt to find and delete the refresh token from the database
                    await userCredentialsModel.updateOne( { '_id': req.user.userId },{ refreshToken : '', googleId : '' } );
                } catch ( error ) {
                    // Log the error if the refresh token removal fails
                    console.error( `Failed to remove refresh token:`, error );
                }

                // Clear the access token cookie by setting its expiration date to a past date
                res.cookie( 'accessToken', '', { httpOnly: true, expires: new Date( 0 ) } );
                // Clear the refresh token cookie by setting its expiration date to a past date
                res.cookie( 'refreshToken', '', { httpOnly: true, expires: new Date( 0 ) } );
                // Clear the refresh token cookie by setting its expiration date to a past date
                res.cookie( 'googleIdToken', '', { httpOnly: true, expires: new Date( 0 ) } );

                // Destroying session
                req.session.destroy( ( error ) => {
                    if ( error ) {
                        console.log( `Failed to destroy the session:`, error );
                    }
                } );

                // Redirect the user to the login page after successfully destroying the session
                return res.redirect( 'loginPage' );
            } 
            return next();
        } );
    } 
    // If access token is provided and the request path is login or sign-up, redirect to home page
    else if ( token && ( req.path === '/loginPage' || req.path === '/signUpPage' ) ) {
        return res.redirect( 'homePage' );
    }
};
