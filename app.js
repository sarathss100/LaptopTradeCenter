// Import necessary modules
import express from "express";
import connectDB from "./utils/db.mjs";
import configSettings from "./config/config.mjs";
import path from "path";
import nocache from "nocache";
import session from "express-session";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import passport from "passport";
import cors from "cors";

// Import routers for handling specific routes
import adminRouter from "./routes/admin.mjs";
import userRouter from "./routes/user.mjs";
import { adminAuthenticator } from "./auth/adminAuthentication.mjs";
import { userAuthenticator } from "./auth/userAuthentication.mjs";

try {
  // Create an instance of the Express application
  const app = express();

  // Resolve __filename and __dirname for ES module compatibility
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Middleware to disable client-side caching
  app.use(nocache());

  // Middleware to parse cookies
  app.use(cookieParser());

  // Middleware CSRF protection
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  // Middleware to handle sessions with configurations for security and session management
  app.use(
    session({
      secret: process.env.SESSION_SECRET, // Secret key for signing the session ID cookie
      resave: false, // Prevents resaving session if unmodified
      saveUninitialized: false, // Don't create session until something is stored
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
      },
    })
  );

  // Set the view engine to EJS and specify the directory for views
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  // Serve static files from the 'public' directory
  app.use(express.static(path.join(__dirname, "public")));

  // Middleware to parse URL-encoded bodies (for HTML form submissions)
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Middleware to parse JSON bodies
  app.use(express.json({ limit: "10mb" }));

  // Error-handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  });

  // Connect to the database
  connectDB(); // Call the connectDB function to establish the connection

  app.use(passport.initialize());

  app.use(
    cors({
      origin: "http://localhost:3000", // Frontend URL
    })
  );

  // Route requests with '/auth' prefix to userRouter
  app.use("/auth", userRouter);

  // Route requests with '/admin' prefix to adminRouter, protected by adminAuthenticator middleware
  app.use("/admin", adminAuthenticator, adminRouter);

  // Route requests with '/user' prefix to userRouter, protected by userAuthenticator middleware
  app.use("/", userAuthenticator, userRouter);

  // Catch-all error handling for routes not found
  app.use((req, res, next) => {
    res.status(404).render('404', { title: "Route not found"});
  });

  // Start the server and listen on the specified port (default is 3000)
  app.listen(configSettings.server.port, (error) => {
    if (!error) {
      console.log(
        `Server started successfully on ${configSettings.server.port}`
      );
    } else {
      console.error(
        `Server failed to start on ${configSettings.server.port}`,
        error
      );
    }
  });
} catch (error) {
  console.error(`Error during server setup:`, error);
}
