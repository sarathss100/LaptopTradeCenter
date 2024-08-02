import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { userCredentialsModel } from '../models/mongodb.mjs';

const authRouter = express.Router();

authRouter.get( '/google', ( req, res ) => {
    const googleClient = new OAuth2Client( 
        req.session.GOOGLE_CLIENT_ID, 
        req.session.GOOGLE_CLIENT_SECRET, 
        'http://localhost:3000/auth/google/callback' 
    );
    const url = googleClient.generateAuthUrl( {
        access_type: 'offline',
        scope: ['profile', 'email'],
    } );

    res.redirect( url );
} );

authRouter.get( '/google/callback', async ( req, res ) => {
    const googleClient = new OAuth2Client( 
        req.session.GOOGLE_CLIENT_ID, 
        req.session.GOOGLE_CLIENT_SECRET, 
        'http://localhost:3000/auth/google/callback' 
    ); 
    try {
        const { tokens }  = await googleClient.getToken( req.query.code );
    
        googleClient.setCredentials( tokens );
        const ticket = await googleClient.verifyIdToken( {
            idToken: tokens.id_token,
            audience: req.session.GOOGLE_CLIENT_ID
        } );

        const payload = ticket.getPayload();
        const userId = payload.sub; 

        let user = await userCredentialsModel.findOne( { googleId: userId } );

        if ( !user ) {
            user = await userCredentialsModel.create( {
                googleId: userId,
                first_name: payload.name,
                email: payload.email
            } );
        };

        req.session.user = user;

        const googleIdToken = tokens.id_token;
        
        const accessTokenSecret = req.session.ACCESS_TOKEN_SECRET;
        const refreshTokenSecret = req.session.REFRESH_TOKEN_SECRET;

        const accessToken = jwt.sign( { userId }, accessTokenSecret, { expiresIn: '5m' });
        const refreshToken = jwt.sign( { userId }, refreshTokenSecret, { expiresIn: '7d' });

        // Update the user document with the new refresh token
        await userCredentialsModel.updateOne( { _id: user._id }, { $set: { refreshToken: refreshToken } });

        res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE === 'production', sameSite: 'Strict' });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE === 'production', sameSite: 'Strict' });
        res.cookie('googleIdToken', googleIdToken, { httpOnly: true, secure: process.env.NODE === 'production', sameSite: 'Strict' });

        res.redirect('/user/homePage');

    } catch ( error ) {
        console.error( 'Error during Google authentication', error );
        res.redirect( 'loginPage' );
    }
} );

// This allows the router to be used in other parts of the application, such as the main app configuration
export default authRouter;
