import { products } from '../../models/productDetailsModel.mjs';
import { Discounts } from '../../models/discountModel.mjs';

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
export const adminAddDiscountPage = ( req, res ) => {
    try {
        // Render the HTML form for adding a new product
        res.render( 'admin/adminDiscountPage' );
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
export const addDiscountForm = async ( req, res ) => {
    
    // Create a new discount instance with the data from the request
    const newDiscount = new Discounts( {
        discount_percentage: req.body.discount_percentage,
        discount_expiration: req.body.discount_expiration
    } );

    try {
        // Save the new product to the database
        const savedDiscount = await newDiscount.save();

        
        res.redirect( '/admin/addDiscountPage' ); // Redirect to the products page upon success
    } catch ( error ) {
        console.error( 'Failed to add the discount', error );
        res.status( 500 ).send( 'Failed to upload the product' ); // Send an error response if the operation fails
    }
};
