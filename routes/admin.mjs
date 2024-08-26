import express from 'express';

// Import all functions from the 'admincontroller.mjs' file
// These functions will handle the logic for various admin-related routes
import * as adminController from '../controllers/admincontroller.mjs';
// Import the 'upload' middleware for handling file uploads
import { upload } from '../controllers/admin_modules/adminAddProduct.mjs';

const adminRouter = express.Router();

/**
 * @route GET /loginPage
 * @description Render the login page for admin authentication.
 * @access Private
 * @function
 * @name loginPage
 */
adminRouter.get('/loginPage', adminController.loginPage);

/**
 * @route POST /loginForm
 * @description Handle admin login form submission and authenticate the admin.
 * @access Private
 * @function
 * @name loginForm
 */
adminRouter.post('/loginForm', adminController.loginForm);

/**
 * @route GET /passwordResetPage
 * @description Render the password reset page for admins who forgot their password.
 * @access Private
 * @function
 * @name resetPasswordPage
 */
adminRouter.get('/passwordResetPage', adminController.resetPasswordPage);

/**
 * @route POST /passwordResetForm
 * @description Handle password reset form submission and update the admin's password.
 * @access Private
 * @function
 * @name resetPasswordForm
 */
adminRouter.post('/passwordResetForm', adminController.resetPasswordForm);

/**
 * @route GET /dashboard
 * @description Render the admin dashboard with various management options.
 * @access Private
 * @function
 * @name dashboard
 */
adminRouter.get('/dashboard', adminController.dashboard);

/**
 * @route GET /addProductPage
 * @description Render the page for adding new products to the inventory.
 * @access Private
 * @function
 * @name addProductPage
 */
adminRouter.get('/addProductPage', adminController.addProductPage);

/**
 * @route POST /addProductForm
 * @description Handle product details form submission and add a new product to the inventory.
 * @access Private
 * @function
 * @name addProductForm
 * @param {object} product_images - The product images to be uploaded.
 */
adminRouter.post('/addProductForm', upload.single('product_images'), adminController.addProductForm);

/**
 * @route GET /productsPage
 * @description Render the page listing all products in the inventory.
 * @access Private
 * @function
 * @name productsPage
 */
adminRouter.get('/productsPage', adminController.productsPage);

/**
 * @route DELETE /productDelete/:id
 * @description Handle request to delete a product based on the provided product ID.
 * @access Private
 * @function
 * @name productDelete
 * @param {string} id - The ID of the product to delete.
 */
adminRouter.delete('/productDelete/:id', adminController.productDelete);

/**
 * @route GET /productUpdatePage/:id
 * @description Render the page for updating product details based on the provided product ID.
 * @access Private
 * @function
 * @name productUpdatePage
 * @param {string} id - The ID of the product to update.
 */
adminRouter.get('/productUpdatePage/:id', adminController.productUpdatePage);

/**
 * @route PUT /productUpdateForm/:id
 * @description Handle product update form submission and update product details.
 * @access Private
 * @function
 * @name productUpdateForm
 * @param {string} id - The ID of the product to update.
 * @param {object} product_images - The updated product images to be uploaded.
 */
adminRouter.put('/productUpdateForm/:id', upload.single('product_images'), adminController.productUpdateForm);

/**
 * @route GET /customersPage
 * @description Render the page listing all customers.
 * @access Private
 * @function
 * @name customersPage
 */
adminRouter.get('/customersPage', adminController.customersPage);

/**
 * @route PUT /blockUser/:id
 * @description Handle request to block a customer based on the provided customer ID.
 * @access Private
 * @function
 * @name blockUser
 * @param {string} id - The ID of the customer to block.
 */
adminRouter.put('/blockUser/:id', adminController.blockUser);

/**
 * @route PUT /unblockUser/:id
 * @description Handle request to unblock a customer based on the provided customer ID.
 * @access Private
 * @function
 * @name unblockUser
 * @param {string} id - The ID of the customer to unblock.
 */
adminRouter.put('/unblockUser/:id', adminController.unblockUser);

/**
 * @route GET /orderListPage
 * @description Render the page listing all orders in the system.
 * @access Private
 * @function
 * @name orderListPage
 */
adminRouter.get('/orderListPage', adminController.orderListPage);

/**
 * @route POST /changeOrderStatus
 * @description Change Order status for the admin.
 * @access Private
 * @function
 * @name changeOrderStatus
 */
adminRouter.post('/updateProductStatus', adminController.chagneOrderStatus);

/**
 * @route GET /addBannerPage
 * @description Render the page for adding new banners for promotions.
 * @access Private
 * @function
 * @name addBannerPage
 */
adminRouter.get('/addBannerPage', adminController.addBannerPage);

/**
 * @route GET /addCouponPage
 * @description Render the page for adding new coupons for discounts.
 * @access Private
 * @function
 * @name addCouponPage
 */
adminRouter.get('/addCouponPage', adminController.addCouponPage);

/**
 * @route GET /addDiscountPage
 * @description Render the page for adding new discounts.
 * @access Private
 * @function
 * @name addDiscountPage
 */
adminRouter.get('/addDiscountPage', adminController.addDiscountPage);

/**
 * @route POST /addDiscountForm
 * @description Handle form submission to add a new discount.
 * @access Private
 * @function
 * @name addDiscountForm
 */
adminRouter.post('/addDiscountForm', adminController.addDiscountForm);

/**
 * @route GET /editDiscountPage/:id
 * @description Render the page for editing an existing discount based on the provided discount ID.
 * @access Private
 * @function
 * @name editDiscountPage
 * @param {string} id - The ID of the discount to edit.
 */
adminRouter.get('/editDiscountPage/:id', adminController.editDiscountPage);

/**
 * @route POST /editDiscountForm/:id
 * @description Handle form submission to update an existing discount.
 * @access Private
 * @function
 * @name editDiscountForm
 * @param {string} id - The ID of the discount to update.
 */
adminRouter.post('/editDiscountForm/:id', adminController.editDiscountForm);

/**
 * @route POST /deleteDiscount/:id
 * @description Handle request to delete a discount based on the provided discount ID.
 * @access Private
 * @function
 * @name deleteDiscount
 * @param {string} id - The ID of the discount to delete.
 */
adminRouter.post('/deleteDiscount/:id', adminController.deleteDiscount);

/**
 * @route GET /salesReportPage
 * @description Render the page for adding sales reports.
 * @access Private
 * @function
 * @name salesReportPage
 */
adminRouter.get('/salesReportPage', adminController.salesReportPage);

/**
 * @route GET /brandsPage
 * @description Render the page listing all brands.
 * @access Private
 * @function
 * @name brandsPage
 */
adminRouter.get('/brandsPage', adminController.brandsPage);

/**
 * @route PUT /blockBrand/:id
 * @description Handle request to block a brand based on the provided brand ID.
 * @access Private
 * @function
 * @name blockBrand
 * @param {string} id - The ID of the brand to block.
 */
adminRouter.put('/blockBrand/:id', adminController.blockBrand);

/**
 * @route PUT /unblockBrand/:id
 * @description Handle request to unblock a brand based on the provided brand ID.
 * @access Private
 * @function
 * @name unblockBrand
 * @param {string} id - The ID of the brand to unblock.
 */
adminRouter.put('/unblockBrand/:id', adminController.unblockBrand);

/**
 * @route GET /logout
 * @description Handle admin logout, clear session, and redirect to the login page.
 * @access Private
 * @function
 * @name logout
 */
adminRouter.get('/logout', adminController.logout);

/**
 * Export the adminRouter to be used in other parts of the application, such as the main app configuration.
 * @module adminRouter
 */
export default adminRouter;