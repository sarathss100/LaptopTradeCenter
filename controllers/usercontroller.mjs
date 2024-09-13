/********************************** MODULE IMPORTS *****************************************************/
// Importing the module that handles user login functionality
import * as userLogin from "./user_modules/userLogin.mjs";

// Importing the module that handles user login through OTP (One-Time Password)
import * as userOtpLogin from "./user_modules/userOtpLogin.mjs";

// Importing the module that handles Google authentication login for the user
import * as googleAuth from "./user_modules/userGoogleAuth.mjs";

// Importing the module that provides functionality for user sign-up
import * as userSignUp from "./user_modules/userSignUp.mjs";

// Importing the module that manages password reset functionality for users
import * as userResetPassword from "./user_modules/userResetPassword.mjs";

// Importing the module that provides the homepage rendering functionality for the user
import userHomePage from "./user_modules/userHomePage.mjs";

// Importing the module that provides the product filtering functionality for the user
import { productsFilterPage } from "./user_modules/userFilterPage.mjs";

// Importing the module that provides functionality for the user profile page
import userProfilePage from "./user_modules/userProfilePage.mjs";

// Importing the module that provides functionality for editing the user profile
import * as editProfile from "./user_modules/userEditProfilePage.mjs";

// Importing the module that provides functionality for adding an address
import * as userAddAddressPage from "./user_modules/userAddAddressPage.mjs";

// Importing the module that provides functionality for editing an address
import * as userEditAddressPage from "./user_modules/usereditAddressPage.mjs";

// Importing the module that provides functionality for managing user orders
import * as userOrderPage from "./user_modules/userOrderPage.mjs";

// Importing the module that provides functionality for managing user coupons
import userCouponPage from "./user_modules/userCouponPage.mjs";

// Importing the module that provides functionality for managing the user's wishlist
import * as userWishListPage from "./user_modules/userWishListPage.mjs";

// Importing the module that provides functionality for managing the user's cart
import * as userCartPage from "./user_modules/userCartPage.mjs";

// Importing the module that provides functionality for managing the checkout process
import * as userCheckOutPage from "./user_modules/chekOutPage.mjs";

// Importing the module that provides functionality for managing the user's product detail page
import * as userProductDetailPage from "./user_modules/userProductDetailPage.mjs";

// Importing the module that handles the user logout process
import userLogout from "./user_modules/userLogout.mjs";

// Importing the module that handles user account deletion functionality
import userDeleteAccount from "./user_modules/userDeleteAccount.mjs";

import { searchProduct } from "./productSearch.mjs";

export const searchProducts = searchProduct;

/********************************** LOGIN CONTROLS *****************************************************/
// Function to render the user login page
export const loginPage = userLogin.loginPage;

// Function to process the login form submission and authenticate the user
export const loginForm = userLogin.loginForm;

/********************************** OTP AUTHENTICATION CONTROLS ****************************************/
// Function to render the page where users can generate an OTP for login
export const generateOTPPage = userOtpLogin.otpGeneratingPage;

// Function to handle OTP generation for the user
export const generateOTP = userOtpLogin.generateOTP;

// Function to render the OTP verification page where users enter the OTP
export const verfiyOTPPage = userOtpLogin.otpVerificationPage;

// Function to handle OTP verification for user login
export const verfiyOTP = userOtpLogin.verifyOTP;

/********************************** GOOGLE AUTHENTICATION CONTROLS **************************************/
// Function to initiate the Google OAuth flow for user login
export const googleInitialializer = googleAuth.googleInitializer;

// Function to handle the callback from Google OAuth after authentication
export const googleCallback = googleAuth.googleCallback;

/********************************** SIGNUP CONTROLS ****************************************************/
// Function to render the user sign-up page
export const signUpPage = userSignUp.signUpPage;

// Function to process the user sign-up form submission
export const signUpForm = userSignUp.signUpForm;

/********************************** USER RESET PASSWORD CONTROLS ***************************************/
// Function to render the password reset page for the user
export const resetPasswordPage = userResetPassword.resetPasswordPage;

// Function to process the password reset form submission
export const resetPasswordForm = userResetPassword.resetPasswordForm;

/********************************** USER HOME PAGE CONTROLS ********************************************/
// Function to render the main homepage for the user
export const homePage = userHomePage;

/********************************** USER PRODUCTS FILTER PAGE CONTROLS *********************************/
// Function to render the product filter page where users can filter products
export const filterPage = productsFilterPage;

/********************************** USER PROFILE PAGE CONTROLS *****************************************/
// Function to render the user profile page displaying user information
export const profilePage = userProfilePage;

// Function to render the edit profile page for users to modify their profile information
export const editProfilePage = editProfile.userEditProfilePage;

// Function to process the form submission for editing the user profile
export const editProfileform = editProfile.userEditProfileForm;

/********************************** USER ADDRESS MANAGEMENT CONTROLS ***********************************/
// Function to render the add address page for users to add a new address
export const addAddressPage = userAddAddressPage.userAddAddressPage;

// Function to process the form submission for adding a new address
export const addAddressform = userAddAddressPage.userAddAddressForm;

// Function to handle the deletion of a user's address
export const deleteAddress = userAddAddressPage.userDeleteAddress;

// Function to render the edit address page for users to edit an existing address
export const editAddressPage = userEditAddressPage.userEditAddressPage;

// Function to process the form submission for editing an existing address
export const editAddressForm = userEditAddressPage.userEditAddressForm;

/********************************** USER ORDER PAGE CONTROLS *******************************************/
// Function to render the user's order page, displaying their past orders
export const orderPage = userOrderPage.userOrderPage;

// Function to handle adding order details to the orderSchema
export const addOrderDetails = userOrderPage.addOrderDetails;

// Function to handle update the quantity of products to the orderSchema
export const updateQty = userOrderPage.updateQty;

// Function to handle cancel the order to the orderSchema
export const cancelOrder = userOrderPage.cancelOrder;

/********************************** USER COUPON PAGE CONTROLS ******************************************/
// Function to render the user's coupon page where available coupons are displayed
export const couponPage = userCouponPage;

/********************************** USER WISHLIST PAGE CONTROLS *****************************************/
// Function to render the user's wishlist page, displaying products the user has added to their wishlist
export const wishListPage = userWishListPage.wishListPage;

// Function to handle adding products to the user's wishlist
export const addProductsToWishList = userWishListPage.addProductToWishList;

// Function to handle removing products from the user's wishlist
export const removeProductsFromWishList =
  userWishListPage.removeProductFromWishList;

/********************************** USER CART PAGE CONTROLS ********************************************/
// Function to render the user's cart page, displaying products the user has added to their cart
export const cartPage = userCartPage.userCartPage;

// Function to handle adding products to the user's cart
export const addToCart = userCartPage.addToCart;

// Function to handle removing product from the user's cart
export const removeFromCart = userCartPage.removeProductFromCart;

/********************************** USER CHECKOUT PAGE CONTROLS ****************************************/
// Function to render the user's checkout page, where the user finalizes their order
export const checkOutPage = userCheckOutPage.userCheckOutPage;

// Function to create Paypal order
export const createPayPalOrder = userCheckOutPage.createOrder;

// Function to capture Paypal order
export const capturePayPalOrder = userCheckOutPage.captureOrder;

/********************************** USER PRODUCT DETAILS PAGE CONTROLS ****************************************/
// Function to render the user's product details page
export const productDetailPage = userProductDetailPage.productDetailPage;

/********************************** USER LOGOUT CONTROLS ************************************************/
// Function to handle the user logout process and terminate the session
export const logout = userLogout;

/********************************** USER ACCOUNT DELETION CONTROLS **************************************/
// Function to handle the process of deleting the user's account from the system
export const DeleteAccount = userDeleteAccount;
