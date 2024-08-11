import multer from 'multer';
import { products } from '../../models/productDetailsModel.mjs';

// Configure multer for handling file uploads in memory
const storage = multer.memoryStorage();
export const upload = multer( { storage: storage } );

/**
 * Renders the page to update a product.
 * This endpoint checks if the user is an admin, fetches the product details based on the product ID,
 * and renders the update product page with the fetched product data.
 * @param {Object} req - The request object containing the product ID in the URL parameters and admin status.
 * @param {Object} res - The response object used to render the update product page or redirect.
 */
export const updateProductPage = async ( req, res ) => {
    try {
        // Extract the product ID from the URL parameters
        const productId = req.params.id;

        // Fetch the product details from the database
        const product = await products.find( { '_id': productId } );

        // Render the update product page with the fetched product data
        res.render( 'admin/adminUpdateProductPage', { product } );
    } catch ( error ) {
        // Log the error if fetching data fails
        console.error( 'Failed to fetch data:', error );
    }
}

/**
 * Handles the form submission to update a product.
 * This endpoint processes the form data, including any uploaded file, and updates the product in the database.
 * @param {Object} req - The request object containing the product ID in the URL parameters, form data, and optional file.
 * @param {Object} res - The response object used to send the result of the update operation.
 */
export const updateProductForm = async ( req, res ) => {
    // Extract the product ID from the URL parameters
    const productId = req.params.id;

    // Prepare the data to be updated in the product
    const updateData = {
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
        product_color: req.body.product_color,
        product_listed: req.body.product_listed,
        customer_ratings: req.body.customer_ratings,
    };

    // If a file is uploaded, include it in the update data
    if ( req.file ) {
        updateData.product_images = {
            data: req.file.buffer, // Store the image data in memory
            contentType: req.file.mimetype, // Store the mime type of the image
        };
    }

    try {
        // Update the product in the database using the product ID and update data
        const updatedProduct = await products.findByIdAndUpdate(
            productId,
            updateData,
            { new: true } // Return the updated document
        );

        // If the product is not found, send a 404 response
        if ( !updatedProduct ) {
            return res.status( 404 ).send( 'Product not found' );
        }

        // Send a success response
        res.status( 200 ).send( 'Product updated successfully' );
    } catch (error) {
        // Log the error if the update operation fails
        console.error('Failed to update the product', error);

        // Send an error response indicating failure
        res.status(500).send('Failed to update the product');
    }
};
