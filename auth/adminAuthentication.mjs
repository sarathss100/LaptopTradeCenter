// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { adminRefreshToken as adminRefreshTokens } from '../models/adminRefreshTokenModel.mjs';
import jwt from 'jsonwebtoken';

/**
 * Middleware function to authenticate admin based on the presence and validity of a token.
 *
 * This middleware checks for an authentication token in the request cookies. It determines whether the admin is 
 * authorized to access a particular route based on the token's presence and validity. The function handles different 
 * scenarios as follows:
 * 
 * 1. If no token is present, it checks if the requested path is among allowed routes such as login and password reset pages.
 *    - If the requested path is allowed, the request proceeds to the next middleware or route handler.
 *    - If the path is not allowed, the user is redirected to the login page.
 * 
 * 2. If a token is present and the path is not a login or password reset page, the function attempts to verify the token
 *    using a secret key:
 *    - If the token verification fails, a 401 Unauthorized response is sent.
 *    - If the token is valid, the decoded token data is attached to the request object (`req.admin`), and the request proceeds.
 * 
 * 3. If a token is present and the path is a login or password reset page, the user is redirected to the dashboard page,
 *    as they are already authenticated.
 * 
 * @param {Object} req - The HTTP request object, which contains cookies and the requested path.
 * @param {Object} res - The HTTP response object, used to send responses or perform redirections.
 * @param {Function} next - The next middleware function in the stack to be called if authentication is successful.
 * 
 * @returns {void} This function does not return a value but either calls `next()` to continue processing or sends an
 *                  HTTP response to the client.
 * 
 * @throws {Error} Throws an error if the token verification fails.
 */
export const adminAuthenticator = ( req, res, next ) => {
    // Retrieve the token from cookies
    const token = req.cookies['accessToken'];
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    /**
     * Function to handle token refresh.
     * 
     * @param {Object} req - The HTTP request object.
     * @param {Object} res - The HTTP response object.
     * 
     * @returns {void}
     */
    const refreshToken = async ( req, res ) => {
        // Retrieve the refresh token from cookies
        const refreshToken = req.cookies['refreshToken'];

        if ( !refreshToken ) {
            return res.status( 401 ).json( { message: 'No refresh token provided' } );
        }

        try {
            // Verify the refresh token
            const decoded = jwt.verify( refreshToken, refreshTokenSecret );
            const adminId = decoded.adminId;
            const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

            const adminRefreshToken = await adminRefreshTokens.findOne( { refreshToken } );

            if ( adminRefreshToken.refreshToken !== refreshToken ) {
                return res.status( 403 ).json( { message: 'Invalid refresh token' } );
            }

            // Generate a new access token
            const newAccessToken = jwt.sign( { adminId }, accessTokenSecret, { expiresIn: '1m' } );

            // Set the JWT access token as an HTTP-only cookie
            res.cookie( 'accessToken', newAccessToken, { httpOnly: true, secure: process.env.NODE === 'production', sameSite: 'Strict' } );
            const path = '/admin' + req.path;
            res.redirect( path );

        } catch ( error ) {
            return res.status( 403 ).json( { message: 'Invalid refresh token' } );
        }
    };

    // Handle requests without a token
    if ( !token ) {
        const allowedRoutes = [ '/loginPage', '/loginForm', '/passwordResetPage', '/passwordResetForm' ];
        if ( allowedRoutes.includes( req.path ) ) {
            // Allow access to specified routes
            return next();
        } else {
            // Redirect to login page if the route is not allowed
            return res.redirect( 'loginPage' );
        }
    }

    // Handle requests with a token
    if ( token && req.path !== '/loginPage' && req.path !== '/passwordResetPage' ) {
        // Verify the token
        jwt.verify( token, secret, ( error, decoded ) => {
            if (error) {
                if ( error.name === 'TokenExpiredError' ) {
                    return refreshToken( req, res );
                }
                // Respond with 401 Unauthorized if verification fails
                return res.status( 401 ).json( { message: 'Unauthorized access' } );
            }

            // Attach decoded token data to the request object and proceed
            req.admin = decoded;
            return next();
        } );
    } else if ( token && ( req.path === '/loginPage' || req.path === '/passwordResetPage' ) ) {
        // Redirect authenticated users away from login or password reset pages
        return res.redirect( 'dashboard' );
    }
};
