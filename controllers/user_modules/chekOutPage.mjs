import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { products as productsList } from '../../models/productDetailsModel.mjs';
import { brands as brand } from '../../models/brandModel.mjs';
import { Cart }  from '../../models/cartModel.mjs';

/** 
 * Renders the user's cart page.
 * This function handles the request to display the user's shopping cart and brand information.
 * 
 * @param {Object} req - The request object containing HTTP request details.
 * @param {Object} res - The response object used to send HTTP responses.
 *
 * @returns {Promise<void>} - A promise that resolves to undefined when the rendering is complete.
 */

const userCheckOutPage = async ( req, res ) => {
    try {
 
        const { subtotal, discounts, gst } = req.query;

        const billSummary = {
            subtotal: Number( subtotal ),
            discount: Number( discounts ),
            gst: Number( gst ) 
        }

        billSummary.grandTotal = (billSummary.subtotal - billSummary.discount) + billSummary.gst;

        const cartId = req.params.id;

        const cart = await Cart.findOne( { '_id': cartId } );
        // .populate({
        //     path: 'products.productId', // Specify the path to populate
        //     populate: {
        //         path: 'discount',
        //         model: 'Discounts'
        //     } // Populate the discount field within each product
        // }).exec();

        const products = cart.products.map( product => product );

        // console.log( products )

        // Extract unique brand names from the product details
        const brands = await brand.find( { 'isBlocked' : false } );

        if ( req.user ) {
            // If the user is authenticated, retrieve user details from the database
            const userId = req.user.userId;
            const user = await userCredentials.findOne( { '_id': userId } );

            // Get the username from the user details
            const username = user.first_name;
            
            // Render the cart page with the user's username and available brands
            res.render('user/checkOutPage', { username, brands, user, billSummary, cart, products } );
        } else {
            // If the user is not authenticated, render the cart page with 'Login' as the username
            res.render( 'user/checkOutPage', { 'username': 'Login', brands, user, billSummary, cart, products } );
        }
    } catch ( error ) {
        // Log the error message to the console for debugging purposes
        console.error( 'Failed to fetch brand names for userCartPage:', error );
        
        // Optionally, send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render the cart page' );
    }
};

// Export the function as the default export, allowing it to be imported and used in other parts of the application
export default userCheckOutPage;