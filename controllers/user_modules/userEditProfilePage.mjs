import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { products as productsList } from '../../models/productDetailsModel.mjs';
import validator from 'validator';

// Function to validate email format using regex
const isValidEmail = ( email ) => validator.isEmail( email );

// Function to validate phone number format using regex
const isValidPhoneNumber = ( phoneNumber ) => {
    const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
    return phoneRegex.test( phoneNumber );
}

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

        const invalidEmailError = req.session.userInvalidEmailError || '';
        const invalidPhoneNumberError = req.session.userInvalidPhoneNumberErrir || '';
        req.session.userInvalidEmailError = '';
        req.session.userInvalidPhoneNumberError = '';

        // Render the 'filterPage' view, passing username, brands, and products
        res.render( 'user/userEditProfile', { username, brands, user, address, invalidEmailError, invalidPhoneNumberError } );
        
    } catch ( error ) {
        // Log any errors that occur during rendering
        console.error( 'Failed to render user profile page:', error );

        // Send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render user profile page' );
    }
};

export const userEditProfileForm = async ( req, res ) => {

    try {

        const userId = req.user.userId;

        // Fetch the user details from the database using the user ID
        const user = await userCredentials.find({ '_id' : userId });

        // const ValidEmail = isValidEmail( req.body.email );
        // const ValidPhoneNumber = isValidPhoneNumber( req.body.phone_number );

        // if ( !ValidEmail ) req.session.userInvalidEmailError = `Please enter valid email`;
        // if ( !ValidPhoneNumber ) req.session.userInvalidPhoneNumberError = `Please eneter valid phone number`;

        // if ( !ValidEmail || !ValidPhoneNumber ) return res.redirect( `editProfilePage` );

        const userProfileData = {
            first_name: req.body.first_name,
            second_name: req.body.second_name,
            phone_number: req.body.phone_number,
            email: req.body.email
        };
        
        await userCredentials.findByIdAndUpdate( userId , userProfileData, { new: true } );

        return res.redirect( 'profilePage' );

    } catch ( error ) {
        console.error( `Failed to update the profile details : `, error );
        res.status( 500 ).send( `Failed to update the profile details ` ); 
    }
};

