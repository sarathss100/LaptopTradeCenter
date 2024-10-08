import multer from "multer";
import { products } from "../../models/productDetailsModel.mjs";
import { brands as brand } from "../../models/brandModel.mjs";
import { Category } from "../../models/categoryModel.mjs";

// Configure multer for handling file uploads in memory
const storage = multer.memoryStorage();
export const upload = multer({ storage: storage }).array("product_images");

/**
 * Renders the page to update a product.
 * This endpoint checks if the user is an admin, fetches the product details based on the product ID,
 * and renders the update product page with the fetched product data.
 * @param {Object} req - The request object containing the product ID in the URL parameters and admin status.
 * @param {Object} res - The response object used to render the update product page or redirect.
 */
export const updateProductPage = async (req, res) => { 
  try {
    const admin = req.user;

    const categories = await Category.find({});

    // Extract the product ID from the URL parameters
    const productId = req.params.id;

    // Fetch the product details from the database
    const product = await products.find({ _id: productId });

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false }).populate("products");

    // Render the update product page with the fetched product data
    res.render("admin/adminUpdateProductPage", {
      product,
      admin,
      brands,
      categories,
    });
  } catch (error) {
    // Log the error if fetching data fails
    console.error("Failed to fetch data:", error);
  }
};

/**
 * Handles the form submission to update a product.
 * This endpoint processes the form data, including any uploaded file, and updates the product in the database.
 * @param {Object} req - The request object containing the product ID in the URL parameters, form data, and optional file.
 * @param {Object} res - The response object used to send the result of the update operation.
 */
export const updateProductForm = async (req, res) => {
  const productId = req.params.id;

  // Extract update fields from the request body
  const updateFields = {
    product_name: req.body.product_name,
    product_price: req.body.product_price,
    product_quantity: req.body.product_quantity,
    product_brand: req.body.product_brand,
    product_model: req.body.product_model,
    processor: req.body.product_processor,
    processor_generation: req.body.processor_generation,
    ram_capacity: req.body.ram_capacity,
    ram_generation: req.body.ram_generation,
    storage_type: req.body.storage_type,
    operating_system: req.body.operating_system,
    usage: req.body.usage,
    weight: req.body.product_weight,
    touch_screen: req.body.touch_screen,
    graphics_type: req.body.graphics_type,
    graphics_generation: req.body.graphics_generation,
    graphics_capacity: req.body.graphics_capacity,
    product_color: req.body.product_color,
  };

  try {
    // First, handle removal of images if any
    if (req.body.removed_images) {
      const removedImageIds = Array.isArray(req.body.removed_images)
        ? req.body.removed_images
        : [req.body.removed_images];

      await products.findByIdAndUpdate(productId, {
        $pull: { product_images: { _id: { $in: removedImageIds } } },
      });
    }

    // Then, handle addition of new images if any
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        data: file.buffer,
        contentType: file.mimetype,
      }));

      await products.findByIdAndUpdate(productId, {
        $push: { product_images: { $each: newImages } },
      });
    }

    // Finally, update other product fields
    await products.findByIdAndUpdate(productId, updateFields, { new: true });

    res.status(200).send("Product updated successfully");
  } catch (error) {
    console.error("Failed to update the product", error);
    res.status(500).send("Failed to update the product");
  }
};
