import { products as productsList } from "../../models/productDetailsModel.mjs";
import { brands } from "../../models/brandModel.mjs";

/**
 * Handles the rendering of the products page with paginated product details.
 *
 * This asynchronous function retrieves a paginated list of products from the database and renders the products page.
 * It supports pagination by using `page` and `limit` query parameters from the request. If these parameters are not provided,
 * default values are used (page 1 and limit 10). The function calculates the total number of pages based on the number of
 * products and the specified limit, and passes this information along with the current page and products to the view for rendering.
 *
 * @param {Object} req - The HTTP request object, which includes query parameters for pagination.
 * @param {Object} res - The HTTP response object, used to render the view with the products and pagination details.
 *
 * @returns {void} This function does not return a value but sends an HTTP response by rendering the view.
 *
 * @throws {Error} Logs an error to the console if there is an issue fetching the product data from the database.
 *
 * @async
 * @example
 *
 */

export const brandsPage = async (req, res) => {
  // Extract page number and limit from query parameters with default values
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const admin = req.user;

    // Extract unique brand names from the product details
    const brand = await brands.find({ isBlocked: false }).populate("products");

    // Get the total count of products that are not marked as deleted
    const count = await brands.countDocuments({});

    // Fetch the products for the current page with pagination
    let brandsCategory = await brands
      .find({})
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("products");

    // Render the products page with products, current page, and total pages
    res.render("admin/adminBrandsPage", {
      brandsCategory,
      admin,
      brand,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    // Log any errors encountered during the data fetching process
    console.error("Failed to fetch the data:", error);
  }
};

/**
 * Handles the request to delete a product by marking it as deleted.
 * This endpoint updates the `isDeleted` field of the product to true, indicating it is no longer active.
 * @param {Object} req - The request object containing the product ID in the URL parameters.
 * @param {Object} res - The response object used to send a response to the client.
 */
export const blockBrand = async (req, res) => {
  try {
    const brandId = req.params.id;
    // Extract the product ID from the URL parameters
    // const productId = req.params.id;

    // Update the product's 'isDeleted' field to true to mark it as deleted
    await brands.findByIdAndUpdate(brandId, { isBlocked: true });

    // Send a success response to the client indicating the product was deleted successfully
    return res.status(200).json({
      success: true,
      message: `Brand with id ${brandId} Blocked successfully`,
    });
  } catch (error) {
    // Log the error for debugging purposes
    console.error(`Failed to remove the product: `, error);

    // Send an error response to the client indicating the deletion failed
    return res.status(500).json({
      success: false,
      message: "Failed to delete the product",
    });
  }
};

/**
 * Handles the request to delete a product by marking it as deleted.
 * This endpoint updates the `isDeleted` field of the product to true, indicating it is no longer active.
 * @param {Object} req - The request object containing the product ID in the URL parameters.
 * @param {Object} res - The response object used to send a response to the client.
 */
export const unblockBrand = async (req, res) => {
  try {
    const brandId = req.params.id;
    // Extract the product ID from the URL parameters
    // const productId = req.params.id;

    // Update the product's 'isDeleted' field to true to mark it as deleted
    await brands.findByIdAndUpdate(brandId, { isBlocked: false });

    // Send a success response to the client indicating the product was deleted successfully
    return res.status(200).json({
      success: true,
      message: `Brand with id ${brandId} unblocked successfully`,
    });
  } catch (error) {
    // Log the error for debugging purposes
    console.error(`Failed to unblock the brand: `, error);

    // Send an error response to the client indicating the deletion failed
    return res.status(500).json({
      success: false,
      message: "Failed to unblocak the brand",
    });
  }
};
