import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { products as productsList } from '../../models/productDetailsModel.mjs';

/**
 * Renders the user edit profile page.
 * 
 * This asynchronous function attempts to render the user edit profile page. If an error occurs during rendering,
 * it logs the error and sends a 500 Internal Server Error response.
 * 
 * @param {Object} req - The HTTP request object containing details of the HTTP request.
 * @param {Object} res - The HTTP response object used to send responses to the client.
 * 
 * @returns {Promise<void>} This function does not return a value but renders the user profile page view or sends an error message.
 * 
 * @throws {Error} Logs an error to the console if there is an issue rendering the user profile page.
 */
export const userEditProfilePage = async ( req, res ) => { 
    
    try {
        // Fetch the products for the current page with pagination
        let products = await productsList.find( { 'isDeleted': false } )

        // Extract unique brand names from the product details
        const brands = [ ...new Set( products.map( product => product.product_brand ) ) ];

        const userId = req.user.userId;

        // Fetch the user details from the database using the user ID
        const user = await userCredentials.find({ '_id' : userId });

        // Extract the username from the user details
        const username = user[0].first_name;

        // Extract the address from the user details
        const address = user[0].address || false;

        // Render the 'filterPage' view, passing username, brands, and products
        res.render( 'user/userEditProfile', { username, brands, user, address } );
        
    } catch ( error ) {
        // Log any errors that occur during rendering
        console.error( 'Failed to render user profile page:', error );

        // Send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render user profile page' );
    }
};  

