import * as collection from '../../models/mongodb.mjs';

/**
 * Renders the users cart page
 * 
 * @param {Object} req - The request object containing HTTP request details.
 * @param {Object} res - The response object used to send HTTP responses.
 * 
 */

const userCartPage = async ( req, res ) => {

    try {
        const products = await collection.productDetailsModel.find({ }, { '_id': 'null', 'product_brand': 1 } );
        const brands = [ ...new Set( products.map( product => product.product_brand ) ) ];

        if ( req.user ) {
            const userId = req.user.userId;
            const user = await collection.userCredentialsModel.findOne( { '_id' : userId } );
            const username = user.first_name;
        
            // If the user is authenticated, render the user home page
            res.render( 'user/cartPage', { username, brands } );
        } else {
            res.render( 'user/cartPage', { 'username' : 'Login', brands } ); 
        }
    } catch ( error ) {
        console.error( `Failed to fetch brandnames for userCartpage : `, error );
    }
};

// This allows the function to be imported and used in other parts of the application
export default userCartPage;