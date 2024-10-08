// import express from 'express';

// // Import all functions from the 'usercontroller.mjs' file
// // These functions will handle the logic for various user-related routes
// import * as userController from '../controllers/usercontroller.mjs';
// const userRouter = express.Router();

// // Route to serve the login page
// // Invokes the 'loginPage' function from the userController to render the login page
// userRouter.get( '/loginPage', userController.loginPage );

// // Route to handle login form submissions
// // Invokes the 'loginForm' function from the userController to process login data
// userRouter.post( '/loginForm', userController.loginForm );

// // Route to serve the Otp login page
// // Invokes the 'otpLoginPage' function from the userController to render the otp login page
// userRouter.get( '/generateOTPPage', userController.generateOTPPage );

// // Route to serve the generate otp
// // Invokes the 'generateOTP' function from the userController to generate the otp
// userRouter.post( '/generateOTP', userController.generateOTP );

// // Route to serve the otp verification page
// // Invokes the 'verifyOTPPage' function from the userController to serve verify otp page
// userRouter.get( '/verifyOTPPage', userController.verfiyOTPPage );

// // Route to handle the otp verification
// // Invokes the 'verifyOTP' function from the userController to hanlde verifying otp
// userRouter.post( '/verifyOTP', userController.verfiyOTP );

// // Route to handle the Google auth verification
// // Invokes the 'googleInitialializer' function from the userController to intialzie the google Auth flow
// userRouter.get( '/google', userController.googleInitialializer );

// // Route to handle the Google auth verification
// // Invokes the 'googleCallback' function from the userController to hanlde callback from Google OAuth
// userRouter.get( '/google/callback', userController.googleCallback );

// // Route to serve the user signup page
// // Invokes the 'signUpPage' function from the userController to process signup data
// userRouter.get( '/signUpPage', userController.signUpPage );

// // Route to handle signup form submissions
// // Invoke the 'signUpForm' function from the userController to process signup data   
// userRouter.post( '/signUpForm', userController.signUpForm );

// // Route to sever the password reset page
// // Invokes the 'resetPasswordPage' function from the userController to render the password reset page
// userRouter.get( '/passwordResetPage', userController.resetPasswordPage );

// // Route to handle password reset form submissions
// // Invokes the 'resetPasswordForm' function from the userController to process passed reset requests
// userRouter.post( '/passwordResetForm', userController.resetPasswordForm );

// // Route to serve the user home page
// // Invokes the 'homePage' function from the userController to render the home page
// userRouter.get( '/homePage', userController.homePage );

// // Route to serve the user filter page
// // Invokes the 'filterPage' function from the userController to render the filter page
// userRouter.get( '/filterPage/:id', userController.filterPage );

// // Route to serve the user filter page
// // Invokes the 'filterPage' function from the userController to render the filter page
// userRouter.get( '/filterPage', userController.filterPage );

// // Route to serve the user profile page
// // Invokes the 'userProfile' function from the userController to render the user profile page
// userRouter.get( '/profilePage', userController.profilePage );

// // Route to serve the user edit profile page
// // Invokes the 'userEditProfilePage' function from the userController to render the user edit profile page
// userRouter.get( '/editProfilePage', userController.editProfilePage );

// // Route to handle update the profile details 
// // Invokes the 'userEditProfileForm' function from the userController to process the user profile details
// userRouter.post( '/editProfileForm', userController.editProfileform );

// // Route to serve the user add address page
// // Invokes the 'userAddAddressPage' function from the userController to render the user add address page
// userRouter.get( '/addAddressPage', userController.addAddressPage );

// // Route to handle add new address form submissions
// // Invokes the 'addAddressForm' function from the userController to process passed add address requests
// userRouter.post( '/addAddressForm', userController.addAddressform );

// // Route to serve edit address page
// // Invokes the 'userEditAddressPage' function from the userController to render the user edit address page
// userRouter.get( '/editAddressPage/:id', userController.editAddressPage );

// // Route to serve edit address page
// // Invokes the 'userEditAddressPage' function from the userController to render the user edit address page
// userRouter.post( '/editAddressForm', userController.editAddressForm );

// // Route to handle delete address
// // Invokes the 'userDeleteAddress' function from the userController to process delete the address
// userRouter.delete( '/deleteAddress', userController.deleteAddress );

// // Route to serve the user order page
// // Invokes the 'userOrderPage' function from the userController to render the user order page
// userRouter.get( '/orderPage', userController.orderPage );

// // Route to serve the user coupon page
// // Invokes the 'userCouponPage' function from the userController to render the user coupon page
// userRouter.get( '/couponPage', userController.couponPage );

// // Route to serve the user wishlist page
// // Invokes the 'userWishListPage' function from the userController to render the user wishlist page
// userRouter.get( '/wishListPage', userController.wishListPage );

// // Route to handle add product to wishlist 
// // Invokes the 'addProductToWishList' function from the userController to add product wishlist
// userRouter.post( '/addProductToWishList/:id', userController.addProductsToWishList );

// // Route to handle remove product to wishlist 
// // Invokes the 'removeProductFromWishList' function from the userController to remove the product from wishlist
// userRouter.post( '/removeProductFromWishList/:id', userController.removeProductsFromWishList );

// // Route to serve the user cart page
// // Invokes the 'userCartPage' function from the userController to render the user cart page
// userRouter.get( '/cartPage', userController.cartPage );

// // Route to serve the user check out page
// // Invokes the 'usercheckOutPage' function from the userController to render the user check out page
// userRouter.get( '/checkOutPage', userController.checkOutPage );

// // Route to handle user logout
// // Invokes the 'logout' function from the userController to log the user out and redirect to loginPage
// userRouter.get( '/logout', userController.logout );

// // Route to handle user logout
// // Invokes the 'logout' function from the userController to log the user out and redirect to loginPage
// userRouter.get( '/deleteAccount', userController.DeleteAccount );

// // This allows the router to be used in other parts of the application, such as the main app configuration
// export default userRouter;
