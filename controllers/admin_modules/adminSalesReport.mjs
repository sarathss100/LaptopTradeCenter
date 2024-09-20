import { brands as brand } from "../../models/brandModel.mjs";
import { Order } from "../../models/orderModel.mjs";

/**
 * Handles rendering the admin dashboard or redirecting to the login page based on the user's authentication status.
 *
 * This function checks the presence of an `admin` object in the session to determine if the user is authenticated.
 * - If the `admin` object is present, it means the user is authenticated and the function renders the admin dashboard page.
 * - If the `admin` object is not present, it means the user is not authenticated, and the function redirects them to the login page.
 *
 * @param {Object} req - The HTTP request object containing HTTP request details, including session data.
 * @param {Object} res - The HTTP response object used to send HTTP responses, including rendering views or redirection.
 *
 * @returns {void} This function does not return a value but either renders the admin dashboard view or sends an error message.
 *
 * @throws {Error} Logs an error to the console if there is an issue rendering the admin dashboard page.
 */
export const adminSalesReport = async (req, res) => {
  try {
    const admin = req.user;

    // Extract Order details from the Database
    const orderDetails = await Order.find({});

    console.log(orderDetails);

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false }).populate("products");

    // Render the admin dashboard page
    res.render("admin/adminSalesReportPage", { admin, brands });
  } catch (error) {
    // Log any errors that occur during the rendering process
    console.error("Failed to render the admin dashboard:", error);

    // Send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Failed to render the admin dashboard");
  }
};
