import multer from "multer";
import { products } from "../../models/productDetailsModel.mjs";
import { brands } from "../../models/brandModel.mjs";
import { Category } from "../../models/categoryModel.mjs";

// Configure multer for handling file uploads in memory
const storage = multer.memoryStorage();
export const upload = multer({ storage: storage }).array("product_images", 10);

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
export const addProductPage = async (req, res) => {
  try {
    const categories = await Category.find({});

    // Render the HTML form for adding a new product
    res.render("admin/adminAddProductPage", { categories });
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
export const addProductForm = async (req, res) => {
  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    console.error("No files uploaded");
    return res.redirect("addProductPage"); // Redirect back to the form page if no files are uploaded
  }

  // Create a new product instance with the data from the request
  const newProduct = new products({
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
    product_images: req.files.map((file) => ({
      data: file.buffer, // Store the image data in memory
      contentType: file.mimetype, // Store the mime type of the image
    })),
    product_color: req.body.product_color,
    product_listed: req.body.product_listed,
    customer_ratings: req.body.customer_ratings,
    isDeleted: false, // Initially set to false, indicating the product is not deleted
  });

  try {
    // Save the new product to the database
    const savedProduct = await newProduct.save();

    // Find or create the brand and update its product list
    let brand = await brands.findOne({
      brand_name: savedProduct.product_brand,
    });

    if (brand) {
      // If brand exists, push the new product into its products array
      brand.products.push(savedProduct._id);
      await brand.save();
    } else {
      // If the brand does not exist, create a new brand entry
      const newBrand = new brands({
        brand_name: savedProduct.product_brand,
        products: [savedProduct._id],
      });

      await newBrand.save();
    }

    res
      .status(200)
      .json({ success: true, message: `Product added successfully` });
  } catch (error) {
    console.error("Failed to upload the product", error);
    res.status(500).send("Failed to upload the product"); // Send an error response if the operation fails
  }
};
