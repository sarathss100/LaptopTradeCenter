// This module handles the login functionality for the user
import * as userLogin from './user_modules/userLogin.mjs';

// This module handles the login through otp functionality for the user
import * as userOtpLogin from './user_modules/userOtpLogin.mjs';

// This module handles the login through Google auth functionality for the user
import * as googleAuth from './user_modules/userGoogleAuth.mjs';

// This module provides the signup page functionality for the user
import * as userSignUp from './user_modules/userSignUp.mjs';

// This module manages password reset functionality for the user
import * as userResetPassword from './user_modules/userResetPassword.mjs';

// This module provides the homepage functionality for the user
import userHomePage  from './user_modules/userHomePage.mjs';

// This module provides the filter page functionality for the user
import { productsFilterPage }  from './user_modules/userFilterPage.mjs';

// This module provides the profilepage functionality for the user
import  userProfilePage  from './user_modules/userProfilePage.mjs';

// This module provides the profile edit page functionality for the user
import  * as editProfile  from './user_modules/userEditProfilePage.mjs';

// This module provides the add address page functionality for the user
import * as userAddAddressPage from './user_modules/userAddAddressPage.mjs';

// This module provides the order page functionality for the user
import  userOrderPage  from './user_modules/userOrderPage.mjs';

// This module provides the coupon page functionality for the user
import  userCouponPage  from './user_modules/userCouponPage.mjs';

// This module provides the wish list page functionality for the user
import  userWishListPage  from './user_modules/userWishListPage.mjs';

// This module provides the cart page functionality for the user
import  userCartPage  from './user_modules/userCartPage.mjs';

// This module handles logout functionality for the user
import userLogout from './user_modules/userLogout.mjs';


/**********************************LOGIN CONTROLS********************************************/

// This function will be used to render the login page
export const loginPage = userLogin.loginPage;

// This function processes the login form submission
export const loginForm = userLogin.loginForm;

/**********************************OTP AUTHENTICATION CONTROLS********************************************/

// This function will be used to render the otp generation page
export const generateOTPPage = userOtpLogin.otpGeneratingPage;

// This function will be used to handle generating otp 
export const generateOTP = userOtpLogin.generateOTP;

// This function will be used to render the otp verification page
export const verfiyOTPPage = userOtpLogin.otpVerificationPage;

// This function will be used to handle verify otp 
export const verfiyOTP = userOtpLogin.verifyOTP;

/**********************************GOOGLE AUTHENTICATION CONTROLS**************************************/

// This function will be used to initialize the OAuth flow
export const googleInitialializer = googleAuth.googleInitialializer;

// This function will be used to handles the callback from google OAuth flow
export const googleCallback = googleAuth.googleCallback;

/**********************************SIGNU UP CONTROLS**************************************************/

// This function will be used to render the user signup page
export const signUpPage = userSignUp.signUpPage;

// This function will be used to signup form submission
export const signUpForm = userSignUp.signUpForm;

/**********************************USER RESET PASSWORD CONTROLS***************************************/

// This function will be used to render the password reset page
export const resetPasswordPage = userResetPassword.resetPasswordPage;

// This function processes the password reset form submission
export const resetPasswordForm = userResetPassword.resetPasswordForm;

/**********************************USER HOME PAGE CONTROLS********************************************/

// This is the main homePage function used to render the user home page
export const homePage = userHomePage;

/**********************************USER PRODUCTS FILTER PAGE CONTROLS*********************************/

// This is the filter page function used to render the user flter page
export const filterPage = productsFilterPage;

/**********************************USER PROFILE PAGE CONTROLS*****************************************/

// This is the user profile page function used to render the user profile page
export const profilePage = userProfilePage;

// This is the user edit profile page function used to render the user edit profile page
export const editProfilePage = editProfile.userEditProfilePage;

// This is the user add address page function used to render the user add address page
export const addAddressPage = userAddAddressPage.userAddAddressPage;

// This is the user add address form function used to process the user add address form data
export const addAddressform = userAddAddressPage.userAddAddressForm;

/**********************************USER ORDER PAGE CONTROLS*****************************************/

// This is the user order page function used to render the user order page
export const orderPage = userOrderPage;

/**********************************USER COUPON PAGE CONTROLS*****************************************/

// This is the user order page function used to render the user coupon page
export const couponPage = userCouponPage;

/**********************************USER WISHLIST PAGE CONTROLS*****************************************/

// This is the user wishlist page function used to render the user wish list page
export const wishListPage = userWishListPage;

/**********************************USER CART PAGE CONTROLS*****************************************/

// This is the user cart page function used to render the user wish list page
export const cartPage = userCartPage;

/**********************************USER LOGOUT PAGE CONTROLS*****************************************/

// This function handles the logout process for the user
export const logout = userLogout;
