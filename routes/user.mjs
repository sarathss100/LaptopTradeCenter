// Import the express module 
import express from "express";

// Import all functions from the 'usercontroller.mjs' file
// These functions will handle the logic for various user-related routes
import * as userController from "../controllers/usercontroller.mjs";

// Initializing  the userRouter
const userRouter = express.Router();

/**
 * @route GET /loginPage
 * @description Render the login page for user authentication.
 * @access Public
 * @function
 * @name loginPage
 */
userRouter.get("/loginPage", userController.loginPage);

/**
 * @route POST /loginForm
 * @description Handle user login form submission and authenticate the user.
 * @access Public
 * @function
 * @name loginForm
 */
userRouter.post("/loginForm", userController.loginForm);

/**
 * @route POST /generateOTP
 * @description Generate an OTP and send it to the user for authentication.
 * @access Public
 * @function
 * @name generateOTP
 */
userRouter.post("/generateOTP", userController.generateOTP);

/**
 * @route POST /verifyOTP
 * @description Handle OTP verification submitted by the user.
 * @access Public
 * @function
 * @name verifyOTP
 */
userRouter.post("/verifyOTP", userController.verfiyOTP);

/**
 * @route POST /removeOTP
 * @description Handle OTP removal after otp timer expires.
 * @access Public
 * @function
 * @name removeOTP
 */
userRouter.post("/removeOTP", userController.removeOTP);

/**
 * @route GET /google
 * @description Initialize the Google OAuth authentication flow.
 * @access Public
 * @function
 * @name googleInitialializer
 */
userRouter.get("/google", userController.googleInitialializer);

/**
 * @route GET /google/callback
 * @description Handle the callback from Google OAuth after authentication.
 * @access Public
 * @function
 * @name googleCallback
 */

userRouter.get("/google/callback", userController.googleCallback);

/**
 * @route GET /signUpPage
 * @description Render the user signup page for new user registrations.
 * @access Public
 * @function
 * @name signUpPage
 */
userRouter.get("/signUpPage", userController.signUpPage);

/**
 * @route POST /signUpForm
 * @description Handle user signup form submission and create a new user account.
 * @access Public
 * @function
 * @name signUpForm
 */
userRouter.post("/signUpForm", userController.signUpForm);

/**
 * @route GET /passwordResetPage
 * @description Render the password reset page for users who forgot their passwords.
 * @access Public
 * @function
 * @name resetPasswordPage
 */
userRouter.get("/passwordResetPage", userController.resetPasswordPage);

/**
 * @route POST /passwordResetForm
 * @description Handle password reset form submission and update the user's password.
 * @access Public
 * @function
 * @name resetPasswordForm
 */
userRouter.post("/passwordResetForm", userController.resetPasswordForm);

/**
 * @route GET /homePage
 * @description Render the user's home page after successful authentication.
 * @access Private
 * @function
 * @name homePage
 */
userRouter.get("/", userController.homePage);

/**
 * @route GET /filterPage/:id
 * @description Render the product filter page based on the provided filter ID.
 * @access Private
 * @function
 * @name filterPage
 * @param {string} id - The ID of the filter to apply.
 */
userRouter.get("/filterPage/:id", userController.filterPage);

/**
 * @route GET /filterPage/:id
 * @description Render the product filter page based on the provided filter ID.
 * @access Private
 * @function
 * @name filterPage
 * @param {string} id - The ID of the filter to apply.
 */
userRouter.get("/filterPage/:query", userController.filterPage);

/**
 * @route GET /filterPage
 * @description Render the product filter page without applying any specific filter.
 * @access Private
 * @function
 * @name filterPage
 */
userRouter.get("/filterPage", userController.filterPage);

/**
 * @route GET /profilePage
 * @description Render the user's profile page displaying their information.
 * @access Private
 * @function
 * @name profilePage
 */
userRouter.get("/profilePage", userController.profilePage);

/**
 * @route GET /editProfilePage
 * @description Render the user profile edit page where users can update their details.
 * @access Private
 * @function
 * @name editProfilePage
 */
userRouter.get("/editProfilePage", userController.editProfilePage);

/**
 * @route POST /editProfileForm
 * @description Handle user profile updates submitted via form.
 * @access Private
 * @function
 * @name editProfileForm
 */
userRouter.post("/editProfileForm", userController.editProfileform);

/**
 * @route GET /addAddressPage
 * @description Render the page for adding a new address to the user's account.
 * @access Private
 * @function
 * @name addAddressPage
 */
userRouter.get("/addAddressPage", userController.addAddressPage);

/**
 * @route POST /addAddressForm
 * @description Handle form submission for adding a new address.
 * @access Private
 * @function
 * @name addAddressform
 */
userRouter.post("/addAddressForm", userController.addAddressform);

/**
 * @route GET /editAddressPage/:id
 * @description Render the page for editing an existing address based on the provided address ID.
 * @access Private
 * @function
 * @name editAddressPage
 * @param {string} id - The ID of the address to edit.
 */
userRouter.get("/editAddressPage/:id", userController.editAddressPage);

/**
 * @route POST /editAddressForm
 * @description Handle form submission for updating an existing address.
 * @access Private
 * @function
 * @name editAddressForm
 */
userRouter.post("/editAddressForm", userController.editAddressForm);

/**
 * @route DELETE /deleteAddress
 * @description Handle request to delete an address from the user's account.
 * @access Private
 * @function
 * @name deleteAddress
 */
userRouter.delete("/deleteAddress", userController.deleteAddress);

/**
 * @route GET /orderPage
 * @description Render the user's order page showing their order history.
 * @access Private
 * @function
 * @name orderPage
 */
userRouter.get("/orderPage", userController.orderPage);

/**
 * @route POST /cancelOrder
 * @description Cancel the order from order history page.
 * @access Private
 * @function
 * @name cancelOrder
 */
userRouter.post("/cancelOrder/:id", userController.cancelOrder);

/**
 * @route POST /checkout
 * @description Handle request to add checkout details to the order schema.
 * @access Private
 * @function
 * @name checkout
 */
userRouter.post("/checkout", userController.addOrderDetails);

/**
 * @route POST /create-paypal-order
 * @description Handle request to create paypal order.
 * @access Private
 * @function
 * @name createPayPalOrder
 */
userRouter.post("/create-paypal-order", userController.createPayPalOrder);

/**
 * @route POST /capture-paypal-order
 * @description Handle request to capture paypal order.
 * @access Private
 * @function
 * @name capturePayPalOrder
 */
userRouter.post("/capture-paypal-order", userController.capturePayPalOrder);

/**
 * @route GET /couponPage
 * @description Render the page for viewing and applying coupons to orders.
 * @access Private
 * @function
 * @name couponPage
 */
userRouter.get("/couponPage", userController.couponPage);

/**
 * @route GET /wishListPage
 * @description Render the user's wishlist page displaying their saved items.
 * @access Private
 * @function
 * @name wishListPage
 */
userRouter.get("/wishListPage", userController.wishListPage);

/**
 * @route POST /addProductToWishList/:id
 * @description Handle request to add a product to the user's wishlist.
 * @access Private
 * @function
 * @name addProductsToWishList
 * @param {string} id - The ID of the product to add to the wishlist.
 */
userRouter.post(
  "/addProductToWishList/:id",
  userController.addProductsToWishList
);

/**
 * @route POST /removeProductFromWishList/:id
 * @description Handle request to remove a product from the user's wishlist.
 * @access Private
 * @function
 * @name removeProductsFromWishList
 * @param {string} id - The ID of the product to remove from the wishlist.
 */
userRouter.post(
  "/removeProductFromWishList/:id",
  userController.removeProductsFromWishList
);

/**
 * @route GET /cartPage
 * @description Render the user's cart page displaying their selected items.
 * @access Private
 * @function
 * @name cartPage
 */
userRouter.get("/cartPage", userController.cartPage);

/**
 * @route POST /addToCart
 * @description Handle request to add a product to the user's cart.
 * @access Private
 * @function
 * @name addToCart
 */
userRouter.post("/addToCart/:id", userController.addToCart);

/**
 * @route POST /updateQty
 * @description Handle request to update the qty of a product to the user's cart.
 * @access Private
 * @function
 * @name updateQty
 */
userRouter.post("/updateQty", userController.updateQty);

/**
 * @route POST /removeFromCart
 * @description Handle request to remove a product from the user's cart.
 * @access Private
 * @function
 * @name removeFromCart
 */
userRouter.post("/removeFromCart", userController.removeFromCart);

/**
 * @route POST /applyCoupon
 * @description Handle request to apply coupon inside the user's cart.
 * @access Private
 * @function
 * @name applyCoupon
 */
userRouter.post("/applyCoupon", userController.applyCoupon);

/**
 * @route POST /addFundPayPalOrder
 * @description Handle request to add create a add fund request to the paypal
 * @access Private
 * @function
 * @name addFundPayPalOrder
 */
userRouter.post("/addFund", userController.addFundPayPalOrder);

/**
 * @route GET /walletSuccess
 * @description Handle request to handle the success
 * @access Private
 * @function
 * @name walletSuccess
 */
userRouter.get("/wallet/success", userController.walletSuccess);

/**
 * @route GET /walletCancel
 * @description Handle request to handle the cancel
 * @access Private
 * @function
 * @name walletCancel
 */
userRouter.get("/wallet/cancel", userController.walletCancel);

/**
 * @route POST /walletCheckOut
 * @description Handle request to Wallet Checkout
 * @access Private
 * @function
 * @name walletCheckOut
 */
userRouter.post("/wallet/checkout", userController.walletCheckOut);

/**
 * @route POST /walletPay
 * @description Handle request to Wallet Payment
 * @access Private
 * @function
 * @name walletPay
 */
userRouter.post("/walletPay", userController.walletPay);

/**
 * @route POST /updatePaymentStatus
 * @description Handle request to Update payment status
 * @access Private
 * @function
 * @name updatePaymentStatus
 */
userRouter.post("/updatePaymentStatus", userController.updatePaymentStatus);

/**
 * @route GET /checkOutPage
 * @description Render the checkout page where users can finalize their purchase.
 * @access Private
 * @function
 * @name checkOutPage
 */
userRouter.get("/checkOutPage/:id", userController.checkOutPage);

/**
 * @route GET /productDetailPage
 * @description Render the product details page where users can see the product information.
 * @access Public
 * @function
 * @name productDetailPage
 */
userRouter.get("/productDetailPage/:id", userController.productDetailPage);

/**
 * @route GET /logout
 * @description Handle user logout, clear session, and redirect to the login page.
 * @access Private
 * @function
 * @name logout
 */
userRouter.get("/logout", userController.logout);

/**
 * @route GET /deleteAccount
 * @description Handle user account deletion request, including session clearance and data removal.
 * @access Private
 * @function
 * @name deleteAccount
 */
userRouter.get("/deleteAccount", userController.DeleteAccount);

/**
 * @route GET /serach
 * @description Handle the search feature for the user side
 * @access Private
 * @function
 * @name serachProducts
 */
userRouter.get("/search", userController.searchProducts);

/**
 * Export the userRouter to be used in other parts of the application, such as the main app configuration.
 * @module userRouter
 */
export default userRouter;
