// Import the configuration file 
import dotenv from 'dotenv';
dotenv.config();

// Importing necessary moudules
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from 'jsonwebtoken';
import { userCredentials } from '../models/userCredentialsModel.mjs';

passport.use( new GoogleStrategy( {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
  }, async ( accessToken, refreshToken, profile, done ) => {
    try {
      // Find or create user in your database
      let user = await userCredentials.findOne({ googleId: profile.id });

      if ( !user ) {
        user = new user({
          googleId: profile.id,
          email: profile.email[0].value,
          first_name: profile.displayName
        });
        await user.save();
      }

      // Extracting the accessTokenSecret and refreshTokenSecret from the env file
      const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
      const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

      // Generate JWT token
      const accessToken = jwt.sign({ id: user._id, email: user.email }, accessTokenSecret, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ id: user._id, email: user.email }, refreshTokenSecret, { expiresIn: '7d' });

      await userCredentials.updateOne({ _id: user._id }, { $set: { refreshToken: refreshToken } });

      res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
      });
      res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
             sameSite: 'Lax',
      });

      done( null, { user, accessToken, refreshToken } );
    } catch ( error ) {
      done( error, false );
    }
  }
) );

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;


