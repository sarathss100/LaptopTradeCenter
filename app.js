// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// Import necessary modules
import express from 'express';
import path from 'path';
import nocache from 'nocache';
import session from 'express-session';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

// Import routers for handling specific routes
import adminRouter from './routes/admin.mjs';
import userRouter from './routes/user.mjs';
import { adminAuthenticator } from './authentication/adminAuthentication.mjs';
import { userAuthenticator } from './authentication/userAuthentication.mjs';

try {
    // Create an instance of the Express application
    const app = express();

    // Resolve __filename and __dirname for ES module compatibility
    const __filename = fileURLToPath( import.meta.url );
    const __dirname = path.dirname( __filename );

    // Middleware to disable client-side caching
    app.use( nocache() );
    
    // Middleware to parse Cookies
    app.use( cookieParser() );

    // Middleware to handle sessions with configurations for security and session management
    app.use( session( {
        secret: process.env.SESSION_SECRET, // Secret key for signing the session ID cookie
        resave: false,  // Prevents resaving session if unmodified
        saveUninitialized: false, // Don't create session until something stored
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 24 Hours
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            httpOnly: true // Prevent client-side Javascript from accessing the cookie
        }
    } ) );

    // Middleware to store the access token secret in the session
    // This middleware assigns the access token secret to the session object for later use
    app.use( ( req, res, next ) => {
        req.session.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
        req.session.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
        req.session.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        req.session.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
        next();
    } );

    // Set the view engine to EJS and specify the directory for views
    app.set( 'view engine', 'ejs' );
    app.set( 'views', path.join( __dirname, 'views' ) );

    // Serve static files from the 'public' directory
    app.use( express.static( path.join( __dirname, 'public' ) ) );

    // Middleware to parse URL-encoded bodies (for HTML form submissions)
    app.use( express.urlencoded( { extended: true } ) );

    // Middleware to parse JSON bodies
    app.use( express.json() );

    app.use( '/auth', userRouter );

    // Route requests with '/user' prefix to userRouter
    app.use( '/user', userAuthenticator, userRouter );

    // Route requests with '/admin' prefix to adminRouter
    app.use( '/admin', adminAuthenticator, adminRouter );

    // Start the server and listen on the specified port (default is 3000)
    const PORT = process.env.PORT || 3000;
    app.listen( PORT, ( error ) => {
        if ( !error ) {
            console.log( `Server started successfully on ${PORT}` );
        } else {
            console.error( `Server failed to start on ${PORT}`, error );
        }
    } );
} catch ( error ) {
    console.error( `Error during server setup:`, error );
};


