import multer from 'multer';
import { productDetailsModel } from '../../models/mongodb.mjs';

// Configure multer for handling file uploads in memory
const storage = multer.memoryStorage();
export const upload = multer( { storage: storage } );

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
export const addProductPage = ( req, res ) => {
    try {
        // Render the HTML form for adding a new product
        res.render( 'admin/adminAddProductPage' );
    } catch ( error ) {
        // Log any errors that occur during the rendering process
        console.error( 'Failed to render the add product page:', error );

        // Send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render the add product page' );
    }
};

/**
 * Handles the form submission for adding a new product.
 * This endpoint processes the form data and saves the product details in the database.
 * @param {Object} req - The request object containing form data and file upload.
 * @param {Object} res - The response object.
 */
export const addProductForm = async ( req, res ) => {
    // Check if a file was uploaded
    if ( !req.file ) {
        console.error( 'No file uploaded' );
        return res.redirect( 'addProductPage' ); // Redirect back to the form page if no file is uploaded
    }

    // Create a new product instance with the data from the request
    const newProduct = new productDetailsModel( {
        product_name: req.body.product_name,
        product_price: req.body.product_price,
        product_quantity: req.body.product_quantity,
        product_brand: req.body.product_brand,
        product_model: req.body.product_model,
        processor: req.body.processor,
        processor_generation: req.body.processor_generation,
        ram_capacity: req.body.ram_capacity,
        ram_generation: req.body.ram_generation,
        storage_type: req.body.storage_type,
        operating_system: req.body.operating_system,
        usage: req.body.usage,
        weight: req.body.weight,
        touch_screen: req.body.touch_screen,
        graphics_type: req.body.graphics_type,
        graphics_generation: req.body.graphics_generation,
        graphics_capacity: req.body.graphics_capacity,
        product_images: {
            data: req.file.buffer, // Store the image data in memory
            contentType: req.file.mimetype, // Store the mime type of the image
        },
        product_color: req.body.product_color,
        product_listed: req.body.product_listed,
        customer_ratings: req.body.customer_ratings,
        isDeleted: false // Initially set to false, indicating the product is not deleted
    } );

    try {
        // Save the new product to the database
        await newProduct.save();
        res.redirect( 'productsPage' ); // Redirect to the products page upon success
    } catch ( error ) {
        console.error( 'Failed to upload the product', error );
        res.status( 500 ).send( 'Failed to upload the product' ); // Send an error response if the operation fails
    }
};
