import { brands as brand } from "../../models/brandModel.mjs";

// This function used for generating coupon code if it is not manually updated
const generateCouponCode = function (length = 8) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let couponCode = "";
  for (let i = 0; i < length; i++) {
    couponCode += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return couponCode;
};

/**
 * Renders the page to add a new product.
 *
 * This asynchronous function renders the HTML form for adding a new product. It serves as the endpoint where an admin can input
 * details for a new product. If an error occurs while rendering the page, it logs the error and sends a 500 Internal Server Error response.
 *
 * @param {Object} req - The HTTP request object containing details of the HTTP request.
 * @param {Object} res - The HTTP response object used to send responses to the client.
 *
 * @returns {void} This function does not return a value but renders the add product page view or sends an error message.
 *
 * @throws {Error} Logs an error to the console if there is an issue rendering the add product page.
 */
export const adminAddCouponPage = async (req, res) => {
  try {
    const admin = req.user;

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false }).populate("products");

    // console.log(brands[0].products[0]);

    // Render the HTML form for adding a new product
    res.render("admin/adminCouponPage", { admin, brands });
  } catch (error) {
    // Log any errors that occur during the rendering process
    console.error("Failed to render the add product page:", error);

    // Send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Failed to render the add product page");
  }
};

/**
 * Handles the form submission for adding a new product.
 * This endpoint processes the form data and saves the product details in the database.
 * @param {Object} req - The request object containing form data and file upload.
 * @param {Object} res - The response object.
 */
export const addCouponForm = async (req, res) => {
  try {
    // Save the new product to the database
    await newProduct.save();
    res.redirect("productsPage"); // Redirect to the products page upon success
  } catch (error) {
    console.error("Failed to upload the product", error);
    res.status(500).send("Failed to upload the product"); // Send an error response if the operation fails
  }
};
