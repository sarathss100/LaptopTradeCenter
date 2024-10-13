// import dotenv from "dotenv";
// dotenv.config();
// import { userCredentials } from "../../models/userCredentialsModel.mjs";
// import jwt from "jsonwebtoken";
// import { OAuth2Client } from "google-auth-library";

// /**
//  * Initiates the Google OAuth process by generating an authentication URL and redirecting the user to it.
//  *
//  * @param {Object} req - The HTTP request object.
//  * @param {Object} res - The HTTP response object.
//  *
//  * @returns {void} This function does not return a value but redirects the user to the Google authentication URL.
//  */
// export const googleInitialializer = (req, res) => {
//   const googleClient = new OAuth2Client(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     process.env.GOOGLE_REDIRECT_URI ||
//       "http://localhost:3000/user/google/callback"
//   );

//   try {
//     const url = googleClient.generateAuthUrl({
//       access_type: "offline",
//       scope: ["profile", "email"],
//     });
//     res.redirect(url);
//   } catch (error) {
//     console.error("Error generating Google authentication URL:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };

// /**
//  * Handles the Google OAuth callback, verifies the token, retrieves user info, and issues JWT tokens.
//  *
//  * @param {Object} req - The HTTP request object, including the query parameters from the callback.
//  * @param {Object} res - The HTTP response object, used to redirect the user after authentication.
//  *
//  * @returns {Promise<void>} This function does not return a value but redirects the user to the home page.
//  */
// export const googleCallback = async (req, res) => {
//   const googleClient = new OAuth2Client(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     process.env.GOOGLE_REDIRECT_URI ||
//       "http://localhost:3000/user/google/callback"
//   );

//   try {
//     if (!req.query.code) {
//       throw new Error("Authorization code not found");
//     }

//     const { tokens } = await googleClient.getToken(req.query.code);
//     googleClient.setCredentials(tokens);

//     const ticket = await googleClient.verifyIdToken({
//       idToken: tokens.id_token,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();
//     const userId = payload.sub;

//     let user = await userCredentials.findOne({ googleId: userId });

//     if (!user) {
//       user = await userCredentials.create({
//         googleId: userId,
//         first_name: payload.name,
//         email: payload.email,
//       });
//     }

//     const authUserId = user._id;

//     const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
//     const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

//     const accessToken = jwt.sign({ authUserId }, accessTokenSecret, {
//       expiresIn: "5m",
//     });
//     const refreshToken = jwt.sign({ authUserId }, refreshTokenSecret, {
//       expiresIn: "7d",
//     });

//     await userCredentials.updateOne(
//       { _id: user._id },
//       { $set: { refreshToken: refreshToken } }
//     );

//     res.cookie("accessToken", accessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "Strict",
//     });
//     res.cookie("refreshToken", refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "Strict",
//     });

//     res.redirect("/user/homePage");
//   } catch (error) {
//     console.error("Error during Google authentication:", error);

//     // Specific error handling
//     if (error.message.includes("Authorization code")) {
//       res.status(400).send("Invalid request: Authorization code not found.");
//     } else if (error.message.includes("token")) {
//       res.status(401).send("Unauthorized: Failed to verify token.");
//     } else {
//       res.status(500).send("Internal Server Error");
//     }
//   }
// };

import dotenv from "dotenv";
dotenv.config();
import { userCredentials } from "../../models/userCredentialsModel.mjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

/**
 * Helper function to initialize the OAuth2Client
 */
const initGoogleClient = () => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3000/user/google/callback"
  );
};

/**
 * Initiates the Google OAuth process by generating an authentication URL and redirecting the user to it.
 */
export const googleInitializer = (req, res) => {
  const googleClient = initGoogleClient();

  try {
    const url = googleClient.generateAuthUrl({
      access_type: "offline",
      scope: ["profile", "email"],
    });
    res.redirect(url);
  } catch (error) {
    console.error("Error generating Google authentication URL:", error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * Handles the Google OAuth callback, verifies the token, retrieves user info, and issues JWT tokens.
 */
export const googleCallback = async (req, res) => {
  const googleClient = initGoogleClient();

  try {
    if (!req.query.code) {
      throw new Error("Authorization code not found");
    }

    const { tokens } = await googleClient.getToken(req.query.code);
    googleClient.setCredentials(tokens);

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;

    let user = await userCredentials.findOne({ googleId: googleId });

    if (!user) {
      user = await userCredentials.create({
        googleId: googleId,
        first_name: payload.name,
        email: payload.email,
        // Consider adding more fields if necessary
      });
    }

    const userId = user._id;
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    const accessToken = jwt.sign({ userId }, accessTokenSecret, {
      expiresIn: "15m", // Consider extending expiration time
    });
    const refreshToken = jwt.sign({ userId }, refreshTokenSecret, {
      expiresIn: "7d",
    });

    await userCredentials.updateOne(
      { _id: user._id },
      { $set: { refreshToken } }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax", // Consistency in cookie attributes
    });

    res.redirect("/");
  } catch (error) {
    console.error("Error during Google authentication:", error);

    if (error.message.includes("Authorization code")) {
      res.status(400).send("Invalid request: Authorization code not found.");
    } else if (error.message.includes("token")) {
      res.status(401).send("Unauthorized: Failed to verify token.");
    } else {
      res.status(500).send("Internal Server Error");
    }
  }
};
