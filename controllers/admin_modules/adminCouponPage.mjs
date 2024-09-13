import { brands as brand } from "../../models/brandModel.mjs"; 
import { Coupon } from "../../models/couponModel.mjs";

// This function used for generating coupon code if it is not manually updated
const generateCouponCode = function (length = 6) {
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

    // Extract coupons from the coupons detatils
    const coupons = await Coupon.find()
      .populate("brandSpecific")
      .populate("productSpecific");

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false }).populate("products");

    

    // Render the HTML form for adding a new product
    res.render("admin/adminCouponPage", { admin, brands, coupons });
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
    const data = req.body;
    let products = [];
    let brands = [];
    let all = false;

    for (let i = 0; i < data.selectedOption.length; i++) {
      if (data.selectedOption[i].split("-")[0] === "brand") {
        brands.push(data.selectedOption[i].split("brand-").join(""));
      } else if (data.selectedOption[i].split("-")[0] === "product") {
        products.push(data.selectedOption[i].split("product-").join(""));
      } else {
        all = true;
      }
    }

    // Auto generated coupons if it is not provided
    const couponCode = !data.couponCode
      ? generateCouponCode()
      : data.couponCode;

    // Extracting coupon expiration date
    const couponExpiration = data.couponExpiration;

    // Create a new coupon object
    const newCoupon = new Coupon({
      type_of_coupon: data.couponOfferType,
      discountValue: data.couponValue,
      brandSpecific: brands,
      productSpecific: products,
      applicableToAllBrands: all,
      usageCount: data.usageCount,
      coupon_expiration: new Date(couponExpiration),
      coupon_code: couponCode,
    });

    // Save the coupon to the database
    const savedCoupon = await newCoupon.save();

    res.json({ message: `Coupon created successfully` });
  } catch (error) {
    console.error("Failed to upload the product", error);
    res.status(500).send("Failed to upload the product"); // Send an error response if the operation fails
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id; // Get the couponId from the URL parameter

    // Find and delete the coupon by its ID
    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

    if (!deletedCoupon) {
      return res
        .status(404)
        .json({ success: false, message: `Coupon not found` });
    }

    // Send a success response if the coupon is deleted
    res.json({ success: true, message: `Coupon deleted successfully` });
  } catch (error) {
    console.error(`Something wrong happend while deleting coupon:`, error);
    // Handle errors and send failure response
    res.status(500).json({
      success: false,
      message: `An error occured while deleting the coupon`,
    });
  }
};
