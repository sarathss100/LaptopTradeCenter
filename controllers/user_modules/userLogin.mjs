import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as collection from '../../models/mongodb.mjs';



export const loginPage = ( req, res ) => {
        const userLoginCredentialsError =  req.session.userLoginCredentialsError || '';
        req.session.userLoginCredentialsError = '';
        res.render( 'user/userLoginPage', { userLoginCredentialsError } );
};

export const loginForm = async ( req, res, next ) => {
    // Extract email and password from the request body
    const { email, password } = req.body;
    const accessTokenSecret = req.session.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = req.session.REFRESH_TOKEN_SECRET;

    try {
        // Fetch the user's credentials from the database
        const user = await collection.userCredentialsModel.findOne( { email } );

        console.log( `loginForm`, user.isBlocked );

        if ( user.isBlocked === 'Blocked' ) {
            req.session.userLoginCredentialsError = 'You are blocked to use the service';
            return res.redirect( 'loginPage' );
        }

        // Check if the user exists
        if ( !user ) {
            req.session.userLoginCredentialsError = 'Invalid email or password';
            return res.redirect( 'loginPage' );
        }

        // Compare the provided password with the stored hash
        const isValidUser = await bcrypt.compare( password, user.password );

        // Check if the password is valid
        if ( !isValidUser ) {
            req.session.userLoginCredentialsError = 'Invalid email or password';
            return res.redirect( 'loginPage' );
        }

        const userId = user.id;

        // Storing userId in request
        req.userId = userId;

        // Generate a JWT access token for the authenticated user
        const accessToken = jwt.sign( { userId }, accessTokenSecret, { expiresIn: '5m' } );

        // Generate a JWT access token for the authenticated user
        const refreshToken = jwt.sign( { userId }, refreshTokenSecret, { expiresIn: '7d' } );

        await collection.userCredentialsModel.updateOne( { '_id': userId }, { 'refreshToken' : refreshToken } );

        // Set the JWT access token as an HTTP-only cookie
        res.cookie( 'accessToken', accessToken, { httpOnly: true, secure: process.env.NODE === 'production', sameSite: 'Strict' } );

        // Set the JWT refresh token as an HTTP-only cookie
        res.cookie( 'refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE === 'production', sameSite: 'Strict' } );

        // Redirect to the home page after successful login
        res.redirect( 'homePage' );
    } catch ( error ) {
        // Log any errors that occur during authentication
        console.error( 'Authentication failed:', error );
        next( error ); 
    }
};