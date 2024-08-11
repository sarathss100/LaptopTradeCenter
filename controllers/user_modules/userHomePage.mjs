import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { products as productList }  from '../../models/productDetailsModel.mjs';

/**
 * Renders the user's home page.
 * 
 * This asynchronous function retrieves product details from the database, extracts unique brand names, 
 * and checks if the user is authenticated. If authenticated, it fetches the user's details and renders 
 * the home page with the user's name, brands, and products. If not authenticated, it renders the home 
 * page with a default "Login" username.
 * 
 * @param {Object} req - The HTTP request object containing user details if authenticated.
 * @param {Object} res - The HTTP response object used to render the home page.
 * 
 * @returns {Promise<void>} This function does not return a value but sends an HTTP response by rendering the view.
 * 
 * @throws {Error} Logs an error to the console if there is an issue fetching data from the database.
 */
const userHomePage = async ( req, res ) => {
    try {
        // Fetch all product details from the database
        const products = await productList.find({});

        // Extract unique brand names from the product details
        const brands = [ ...new Set( products.map( product => product.product_brand ) ) ];

        // Check if the user is authenticated
        if ( req.user ) {
            
            const userId = req.user.userId;
            
            // Fetch the user details from the database using the user ID
            const user = await userCredentials.findOne( { '_id': userId } );
            
            // Extract the username from the user details
            const username = user.first_name;
            
            // If the user is authenticated, render the user home page with username, brands, and products
            res.render( 'user/homePage', { username, brands, products } );
        } else {

            // If the user is not authenticated, render the home page with a default "Login" username
            res.render( 'user/homePage', { 'username': 'Login', brands, products } );
        }
    } catch ( error ) {
        // Log the error message to the console for debugging purposes
        console.error( 'Failed to fetch data for user HomePage', error );

        // Send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Error fetching user home page data' );
    }
};

// This allows the function to be imported and used in other parts of the application
export default userHomePage;
