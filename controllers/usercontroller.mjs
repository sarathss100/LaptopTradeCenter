// This module handles the login functionality for the user
import * as userLogin from './user_modules/userLogin.mjs';

// This module provides the signup page functionality for the user
import * as userSignUp from './user_modules/userSignUp.mjs';

// This module manages password reset functionality for the user
import * as userResetPassword from './user_modules/userResetPassword.mjs';

// This module provides the homepage functionality for the user
import userHomePage  from './user_modules/userHomePage.mjs';

// This module provides the profilepage functionality for the user
import  userProfilePage  from './user_modules/userProfilePage.mjs';

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

import * as google from '../authentication/userAuthentication.mjs';

export const googleInitial = google.googleInitial;
export const googleMiddle = google.googleMiddle;

// This function will be used to render the login page
export const loginPage = userLogin.loginPage;

// This function processes the login form submission
export const loginForm = userLogin.loginForm;

// This function will be used to render the user signup page
export const signUpPage = userSignUp.signUpPage;

// This function will be used to signup form submission
export const signUpForm = userSignUp.signUpForm;

// This function will be used to render the password reset page
export const resetPasswordPage = userResetPassword.resetPasswordPage;

// This function processes the password reset form submission
export const resetPasswordForm = userResetPassword.resetPasswordForm;

// This is the main homePage function used to render the user home page
export const homePage = userHomePage;

// This is the user profile page function used to render the user profile page
export const profilePage = userProfilePage;

// This is the user order page function used to render the user order page
export const orderPage = userOrderPage;

// This is the user order page function used to render the user coupon page
export const couponPage = userCouponPage;

// This is the user wishlist page function used to render the user wish list page
export const wishListPage = userWishListPage;

// This is the user cart page function used to render the user wish list page
export const cartPage = userCartPage;

// This function handles the logout process for the user
export const logout = userLogout;
