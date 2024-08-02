import bcrypt from 'bcrypt';
import * as collection from '../../models/mongodb.mjs';
import jwt from 'jsonwebtoken';

/**
 * Render the login page or redirect to dashboard if already authenticated.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const loginPage = ( req, res ) => {
    // Retrieve any authentication error message from session, if available
    const adminLoginCredentialsError = req.session.adminLoginCredentialsError || '';
    req.session.adminLoginCredentialsError = ''; // Clear the error message

    // Render the login page with any error message
    res.render( 'admin/adminLoginPage', { adminLoginCredentialsError } );
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
    const accessTokenSecret = req.session.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = req.session.REFRESH_TOKEN_SECRET;
    const saltRounds = 10;

    try {
        // Fetch the admin's credentials from the database
        const admin = await collection.adminCredentialsModel.findOne( { email } );

        // Check if the admin exists
        if ( !admin ) {
            req.session.adminLoginCredentialsError = 'Invalid email or password';
            return res.redirect( 'loginPage' );
        }

        // Compare the provided password with the stored hash
        const isValidAdmin = await bcrypt.compare( password, admin.password );

        // Check if the password is valid
        if ( !isValidAdmin ) {
            req.session.adminLoginCredentialsError = 'Invalid email or password';
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


