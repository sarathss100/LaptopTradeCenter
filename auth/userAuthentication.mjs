// import { userCredentialsModel } from '../models/mongodb.mjs';
// import jwt from 'jsonwebtoken';
// import { OAuth2Client } from 'google-auth-library';

// export const googleInitial = ( req, res ) => {
//     const googleClient = new OAuth2Client( 
//         req.session.GOOGLE_CLIENT_ID, 
//         req.session.GOOGLE_CLIENT_SECRET, 
//         'http://localhost:3000/auth/google/callback' 
//     );
//     const url = googleClient.generateAuthUrl( {
//         access_type: 'offline',
//         scope: ['profile', 'email'],
//     } );

//     res.redirect( url );
// };

// export const googleMiddle = async ( req, res ) => {
//     const googleClient = new OAuth2Client( 
//         req.session.GOOGLE_CLIENT_ID, 
//         req.session.GOOGLE_CLIENT_SECRET, 
//         'http://localhost:3000/auth/google/callback' 
//     ); 
//     try {
//         const { tokens }  = await googleClient.getToken( req.query.code );

//         googleClient.setCredentials( tokens );
//         const ticket = await googleClient.verifyIdToken( {
//             idToken: tokens.id_token,
//             audience: req.session.GOOGLE_CLIENT_ID
//         } );

//         const payload = ticket.getPayload();
//         const userId = payload.sub; 

//         let user = await userCredentialsModel.findOne( { googleId: userId } );
//         // console.log(user)

//         if ( !user ) {
//             user = await userCredentialsModel.create( {
//                 googleId: userId,
//                 first_name: payload.name,
//                 email: payload.email
//             } );
//         } 

//         const authUserId = user._id;
        
//         const accessTokenSecret = req.session.ACCESS_TOKEN_SECRET;
//         const refreshTokenSecret = req.session.REFRESH_TOKEN_SECRET;

//         const accessToken = jwt.sign( { authUserId }, accessTokenSecret, { expiresIn: '5m' });
//         const refreshToken = jwt.sign( { authUserId }, refreshTokenSecret, { expiresIn: '7d' });

//         // Update the user document with the new refresh token
//         await userCredentialsModel.updateOne( { _id: user._id }, { $set: { refreshToken: refreshToken } });

//         res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production',  sameSite: 'Strict', path: '/' });
//         res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict', path: '/' });

//         res.redirect('/user/homePage');

//     } catch ( error ) {
//         console.error( 'Error during Google authentication', error );
//         res.redirect( 'loginPage' );
//     }
// };
// /**
//  * Middleware function to authenticate admin based on the presence and validity of a token.
//  *
//  * This middleware checks for an authentication token in the request cookies. It determines whether the admin is 
//  * authorized to access a particular route based console.log( `googleMiddle`, user )on the token's presence and validity. The function handles different 
//  * scenarios as follows:
//  * 
//  * 1. If no token is present, it checks if the requested path is among allowed routes such as login and password reset pages.
//  *    - If the requested path is allowed, the request proceeds to the next middleware or route handler.
//  *    - If the path is not allowed, the user is redirected to the login page.
//  * 
//  * 2. If a token is present and the path is not a login or password reset page, the function attempts to verify the token
//  *    using a secret key:
//  *    - If the token verification fails, a 401 Unauthorized response is sent.
//  *    - If the token is valid, the decoded token data is attached to the request object (`req.admin`), and the request proceeds.
//  * 
//  * 3. If a token is present and the path is a login or password reset page, the user is redirected to the dashboard page,
//  *    as they are already authenticated.
//  * 
//  * @param {Object} req - The HTTP request object, which contains cookies and the requested path.
//  * @param {Object} res - The HTTP response object, used to send responses or perform redirections.
//  * @param {Function} next - The next middleware function in the stack to be called if authentication is successful.
//  * 
//  * @returns {void} This function does not return a value but either calls `next()` to continue processing or sends an
//  *                  HTTP response to the client.
//  * 
//  * @throws {Error} Throws an error if the token verification fails.
//  */
// export const userAuthenticator = ( req, res, next ) => {

//     // Retrieve the token from cookies
//     const token = req.cookies['accessToken'];
//     console.log(req.cookies)
//     const secret = req.session.ACCESS_TOKEN_SECRET;
//     const refreshTokenSecret = req.session.REFRESH_TOKEN_SECRET;

//     //console.log( token )

//     // console.log( 'userauth', googleIdToken );
//     // console.log( 'userauth', req.session.googleUser );
//     /**
//      * Function to handle token refresh.
//      * 
//      * @param {Object} req - The HTTP request object.
//      * @param {Object} res - The HTTP response object.
//      * 
//      * @returns {void}
//      */
//     const refreshToken = async ( req, res ) => {
   
//         // Retrieve the refresh token from cookies
//         const refreshToken = req.cookies['refreshToken'];

//         if ( !refreshToken ) {
//             return res.status( 401 ).json( { message: 'No refresh token provided' } );
//         }

//         try {
//             // Verify the refresh token
//             const decoded = jwt.verify( refreshToken, refreshTokenSecret );
//             const userId = decoded.userId;
//             const accessTokenSecret = req.session.ACCESS_TOKEN_SECRET;

//             const userRefreshToken = await userCredentialsModel.findOne( { refreshToken } );

//             if ( userRefreshToken.refreshToken !== refreshToken ) {
//                 return res.status( 403 ).json( { message: 'Invalid refresh token' } );
//             }

//             // Generate a new access token
//             const newAccessToken = jwt.sign( { userId }, accessTokenSecret, { expiresIn: '5m' } );

//             // Set the JWT access token as an HTTP-only cookie
//             res.cookie( 'accessToken', newAccessToken, { 
//                 httpOnly: true, 
//                 secure: process.env.NODE === 'production', 
//                 sameSite: 'Strict' 
//             } );
//             const path = '/user' + req.path;
//             res.redirect( path );

//         } catch ( error ) {
//             return res.status( 403 ).json( { message: 'Invalid refresh token' } );
//         }
//     };

//     // Handle requests without a token
//     if ( !token ) {
//         const allowedRoutes = [ '/loginPage', '/loginForm', '/signUpPage', '/signUpForm', '/homePage', '/passwordResetPage', '/passwordResetForm' ];
//         if ( allowedRoutes.includes( req.path ) ) {
//             // Allow access to specified routes
//             return next();
//         } else {
//             // Redirect to login page if the route is not allowed
//             return res.redirect( 'loginPage' );
//         }
//     }

//     // Handle requests with a token
//     if ( token && req.path !== '/loginPage' && req.path !== '/signUpPage' ) {
//         // Verify the token
//         jwt.verify( token, secret, ( error, decoded ) => {
//             if (error) {
//                 if ( error.name === 'TokenExpiredError' ) {
//                     return refreshToken( req, res );
//                 }
//                 // Respond with 401 Unauthorized if verification fails
//                 return res.status( 401 ).json( { message: 'Unauthorized access' } );
//             }

//             // Attach decoded token data to the request object and proceed
//             req.user = decoded;
//             console.log( req.user );
//             return next();
//         } );
//     } else if ( token && req.path === '/loginPage' || req.path === 'signUpPage' ) {
//         // Redirect authenticated users away from login or password reset pages
//         return res.redirect( 'homePage' );
//     }
// };

import { userCredentialsModel } from '../models/mongodb.mjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

export const googleInitial = (req, res) => {
    const googleClient = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'http://localhost:3000/auth/google/callback'
    );
    const url = googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['profile', 'email'],
    });

    res.redirect(url);
};

export const googleMiddle = async (req, res) => {
    const googleClient = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'http://localhost:3000/auth/google/callback'
    );
    try {
        const { tokens } = await googleClient.getToken(req.query.code);

        googleClient.setCredentials(tokens);
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const userId = payload.sub;

        let user = await userCredentialsModel.findOne({ googleId: userId });

        if (!user) {
            user = await userCredentialsModel.create({
                googleId: userId,
                first_name: payload.name,
                email: payload.email
            });
        }

        const authUserId = user._id;

        const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
        const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

        const accessToken = jwt.sign({ authUserId }, accessTokenSecret, { expiresIn: '5m' });
        const refreshToken = jwt.sign({ authUserId }, refreshTokenSecret, { expiresIn: '7d' });

        // Update the user document with the new refresh token
        await userCredentialsModel.updateOne({ _id: user._id }, { $set: { refreshToken: refreshToken } });

        res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });

        res.redirect('/user/homePage');

    } catch (error) {
        console.error('Error during Google authentication', error);
        res.redirect('loginPage');
    }
};

export const userAuthenticator = (req, res, next) => {
    console.log(`userAuthenticator:`, req.cookies );
    const token = req.cookies['accessToken'];
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    const refreshTokenHandler = async (req, res) => {
        const refreshToken = req.cookies['refreshToken'];

        if (!refreshToken) {
            return res.status(401).json({ message: 'No refresh token provided' });
        }

        try {
            const decoded = jwt.verify(refreshToken, refreshTokenSecret);
            const userId = decoded.authUserId;
            const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

            const user = await userCredentialsModel.findOne({ refreshToken });

            if (!user || user.refreshToken !== refreshToken) {
                return res.status(403).json({ message: 'Invalid refresh token' });
            }

            const newAccessToken = jwt.sign({ authUserId: userId }, accessTokenSecret, { expiresIn: '5m' });

            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict'
            });

            return res.redirect(req.originalUrl);

        } catch (error) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }
    };

    if (!token) {
        const allowedRoutes = ['/loginPage', '/loginForm', '/signUpPage', '/signUpForm', '/homePage', '/passwordResetPage', '/passwordResetForm'];
        if (allowedRoutes.includes(req.path)) {
            return next();
        } else {
            return res.redirect('loginPage');
        }
    }

    if (token && req.path !== '/loginPage' && req.path !== '/signUpPage') {
        jwt.verify(token, secret, (error, decoded) => {
            if (error) {
                if (error.name === 'TokenExpiredError') {
                    return refreshTokenHandler(req, res);
                }
                return res.status(401).json({ message: 'Unauthorized access' });
            }

            req.user = decoded;
            return next();
        });
    } else if (token && (req.path === '/loginPage' || req.path === '/signUpPage')) {
        return res.redirect('homePage');
    }
};
