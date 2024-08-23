import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { products as productsList } from '../../models/productDetailsModel.mjs';
import { brands as brand } from '../../models/brandModel.mjs';

/**
 * Renders the user add address page.
 * 
 * This asynchronous function attempts to render the user add address page. If an error occurs during rendering,
 * it logs the error and sends a 500 Internal Server Error response.
 * 
 * @param {Object} req - The HTTP request object containing details of the HTTP request.
 * @param {Object} res - The HTTP response object used to send responses to the client.
 * 
 * @returns {Promise<void>} This function does not return a value but renders the add address page view or sends an error message.
 * 
 * @throws {Error} Logs an error to the console if there is an issue rendering the user add address page.
 */
export const userAddAddressPage = async ( req, res ) => { 
    
    try {
        
        // Fetch the products for the current page with pagination
        let products = await productsList.find( { 'isDeleted': false } )

        // Extract unique brand names from the product details
        const brands = await brand.find( { 'isBlocked' : false } );

        const userId = req.user.userId;

        // Fetch the user details from the database using the user ID
        const user = await userCredentials.find({ '_id' : userId });

        // Extract the username from the user details
        const username = user[0].first_name;

        // Render the 'filterPage' view, passing username, brands, and products
        res.render( 'user/userAddAddressPage', { username, brands, user } );
        
    } catch ( error ) {
        // Log any errors that occur during rendering
        console.error( 'Failed to render user profile page:', error );

        // Send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render user profile page' );
    }
};  


/**
 * Handles the form submission for adding a new address.
 * This endpoint processes the form data and saves the new address in the database.
 * @param {Object} req - The request object containing form data.
 * @param {Object} res - The response object.
 */
export const userAddAddressForm = async ( req, res ) => {

    const userId = req.user.userId;

    // Create a new product instance with the data from the request
    const addAddress = {
        address_line_1: req.body.address_line_1,
        address_line_2: req.body.address_line_2,
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        zip_code: req.body.zip_code
    };

    try {
        // Save the new product to the database
        await userCredentials.findOneAndUpdate( 
            { '_id': userId },
            { $push: { 'address': addAddress } },
            { new: true }
        );

        res.redirect( 'profilePage' ); // Redirect to the profile page upon success
    } catch ( error ) {
        console.error( 'Failed to upload the product', error );
        res.status( 500 ).send( 'Failed to upload the product' ); // Send an error response if the operation fails
    }
};

export const userDeleteAddress = async ( req, res ) => {
    
    try {
        const userId = req.user.userId;
        const addressId = req.body.addressId;

        const result = await userCredentials.findOneAndUpdate( 
            { '_id' : userId },
            { $pull: { address: { _id: addressId } } },
            { new: true } 
        );

        if ( result ) {
            return res.status( 200 ).json( {success: true, message: 'Address deleted successfully' } );
        } else {
            return res.status( 404 ).json( { success: false, message: 'User or address not found' } );
        }
    } catch ( error ) {
        console.error( `Error deleting address:`, error );
        return res.status( 500 ).json( { success: false, message: 'Internal server error' } );
    }
};