import express from 'express';

// Import all functions from the 'admincontroller.mjs' file
// These functions will handle the logic for various admin-related routes
import * as adminController from '../controller/admincontroller.mjs';
import { upload } from '../controller/admin_modules/adminAddProduct.mjs';
const adminRouter = express.Router();

// Route to serve the login page
// Invokes the 'loginPage' function from the adminController to render the login page
adminRouter.get( '/loginPage', adminController.loginPage );

// Route to handle login form submissions
// Invokes the 'loginForm' function from the adminController to process login data
adminRouter.post( '/loginForm', adminController.loginForm );

// Route to sever the password reset page
// Invokes the 'resetPasswordPage' function from the adminController to render the password reset page
adminRouter.get( '/passwordResetPage', adminController.resetPasswordPage );

// Route to handle password reset form submissions
// Invokes the 'resetPasswordForm' function from the adminController to process passed reset requests
adminRouter.post( '/passwordResetForm', adminController.resetPasswordForm );

// Route to serve the admin dashboard
// Invokes the 'dashboard' function from the adminController to render the admin dashboard
adminRouter.get( '/dashboard', adminController.dashboard );

// Route to serve the admin add product page
// Invokes the 'addProduct' function from the adminController to render the admin add product page
adminRouter.get( '/addProductPage', adminController.addProductPage );

// Route to handle product details form submisstion
// Invokes the 'addProduct' function from the adminController to process the product details
adminRouter.post( '/addProductForm', upload.single( 'product_images' ), adminController.addProductForm );

// Route to serve the products for admin
// Invokes the 'productsPage' function from the adminController to render products 
adminRouter.get( '/productsPage', adminController.productsPage );

// Route to delete products for admin
// Invokes the 'productDelete' function from the adminController to delete product
adminRouter.delete( '/productDelete/:id', adminController.productDelete );

// Route to serve the update details page for products
// Invokes the 'productUpdate' function from the adminController to update product
adminRouter.get( '/productUpdatePage/:id', adminController.productUpdatePage );

// Route to update products form submission
// Invoke the 'productUpdateForm' function from the adminController to update product
adminRouter.put( '/productUpdateForm/:id', upload.single( 'product_images' ), adminController.productUpdateForm );

// Route to serve the customers list for admin
// Invokes the 'customerListPage' function from the adminController to render customers
adminRouter.get( '/customersPage', adminController.customersPage );

// Route to block the user for admin
// Invoke the 'blockCustomer' function from the adminController to block the customer
adminRouter.put( '/blockUser/:id', adminController.blockUser );

// Route to Unblock the user for admin
// Invoke the 'UnblockCustomer' function from the adminController to Unblock the customer
adminRouter.put( '/unblockUser/:id', adminController.unblockUser );

// Route to handle user logout
// Invokes the 'logout' function from the adminController to log the user out and redirect to loginPage
adminRouter.get( '/logout', adminController.logout );

// This allows the router to be used in other parts of the application, such as the main app configuration
export default adminRouter;
