// This module handles the login functionality for the admin
import * as adminLogin from './admin_modules/adminLogin.mjs';

// This module manages password reset functionality for the admin
import * as adminResetPassword from './admin_modules/adminResetPassword.mjs';

// This module renders the admin dashboard
import adminDashBoard from './admin_modules/adminDashboard.mjs';

// This module handles logout functionality for the admin
import adminLogout from './admin_modules/adminLogout.mjs';

// This module handles the addProduct functionality for the admin
import * as adminAddProduct from './admin_modules/adminAddProduct.mjs';

// This module renders the Products for the admin
import { productsPage as productPage } from './admin_modules/adminProducts.mjs';

// This module renders the Customers List for the admin
import { customersListPage } from './admin_modules/adminCustomers.mjs';

// This module block the Customer for the admin
import { blockCustomer } from './admin_modules/adminBlockCustomer.mjs';

// This module Unblock the Customer for the admin
import { unblockCustomer } from './admin_modules/adminUnblockCustomer.mjs';

// This module delete the products for the admin
import { deleteProduct } from './admin_modules/adminDeleteProduct.mjs';

// This module update the product for the admin
import * as adminUpdateProduct from './admin_modules/adminUpdateProduct.mjs';

// This module renders the Order List for the admin
import { adminorderListPage } from './admin_modules/adminOrderList.mjs';

// This module renders the add Banner page for the admin
import * as adminBannerPage from './admin_modules/adminBannerPage.mjs';

// This module renders the add Coupon page for the admin
import * as adminCouponPage from './admin_modules/adminCouponPage.mjs';

// This module renders the add Discount page for the admin
import * as adminDiscountPage from './admin_modules/adminDiscountPage.mjs';

// This module renders the sales report page for the admin
import * as adminSalesReportPage from './admin_modules/adminSalesReport.mjs';

// This module renders the brands page for the admin
import * as adminBrandsPage from './admin_modules/adminBrands.mjs';

// This function will be used to render the login page
export const loginPage = adminLogin.loginPage;

// This function processes the login form submission
export const loginForm = adminLogin.loginForm;

// This function will be used to render the password reset page
export const resetPasswordPage = adminResetPassword.resetPasswordPage;

// This function processes the password reset form submission
export const resetPasswordForm = adminResetPassword.resetPasswordForm;

// This function used to render the admin dashborad
export const dashboard = adminDashBoard;

// This is function used to render the admin add product page
export const addProductPage = adminAddProduct.addProductPage;

// This fucntion processes the product details and stored in database
export const addProductForm = adminAddProduct.addProductForm;

// This fucntion used to render the products for admin
export const productsPage = productPage;

// This function used to render the customer list for admin
export const customersPage = customersListPage;

// This function used to block the customer for admin
export const blockUser = blockCustomer;

// This function used to Unblock the customer for admin
export const unblockUser = unblockCustomer;

// This function used to delete the products for admin
export const productDelete = deleteProduct;

// This function used to update the product details
export const productUpdatePage = adminUpdateProduct.updateProductPage;

// This function processes the product details and stored in database
export const productUpdateForm = adminUpdateProduct.updateProductForm;

// This function used to render the order list for admin
export const orderListPage = adminorderListPage;

// This function used to render the add banner page for admin
export const addBannerPage = adminBannerPage.adminAddBannerPage;

// This function used to render the add coupon page for admin
export const addCouponPage = adminCouponPage.adminAddCouponPage;

// This function used to render the add discount page for admin
export const addDiscountPage = adminDiscountPage.adminAddDiscountPage;

// This function used to render the add sales report page for admin
export const salesReportPage = adminSalesReportPage.adminSalesReport;

// This function used to render the brands page for admin
export const brandsPage = adminBrandsPage.brandsPage;

// This function handles the logout process for the admin
export const logout = adminLogout;
