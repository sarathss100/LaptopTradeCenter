import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { brands as brand } from '../../models/brandModel.mjs';

/**
 * Handles the rendering of the products page with paginated product details.
 * 
 * This asynchronous function retrieves a paginated list of products from the database and renders the products page.
 * It supports pagination by using `page` and `limit` query parameters from the request. If these parameters are not provided,
 * default values are used (page 1 and limit 10). The function calculates the total number of pages based on the number of
 * products and the specified limit, and passes this information along with the current page and products to the view for rendering.
 * 
 * @param {Object} req - The HTTP request object, which includes query parameters for pagination.
 * @param {Object} res - The HTTP response object, used to render the view with the products and pagination details.
 * 
 * @returns {void} This function does not return a value but sends an HTTP response by rendering the view.
 * 
 * @throws {Error} Logs an error to the console if there is an issue fetching the product data from the database.
 */

export const productsFilterPage = async ( req, res ) => {

    // Extract page number and limit from query parameters with default values
    const page = parseInt( req.query.page ) || 1;
    const limit = parseInt( req.query.limit ) || 10;
    
    try {
        let products = '';
        let dir = '';
        let category = '';
        let filter = req.query.filter;
        let sort = req.query.sort || '';

        if ( filter === 'brand' ) {
            // Determine the sort order based on the query parameter
            let sortOrder = null;
            const brandId = req.query.id || '';

            if ( sort === 'highToLow' ) {
                sortOrder = { product_price: -1 };
            } else if ( sort === 'lowToHigh' ) {
                sortOrder = { product_price: 1 };
            }

            // Common query with dynamic sorting
            const brands = await brand.find( { _id: brandId } ).populate( {
                path: 'products',
                match: {
                    isDeleted: false,
                    product_quantity: { $gt: 0 }
                },
                options: sortOrder ? { sort: sortOrder } : {}
            } );

            // Extract the relevant data from the result
            products = brands[0].products;
            dir = brands[0];
            category = brands[0].brand_name;

            sort = '';
            
        } else {
            const brands = await brand.find( { 'isBlocked': false } ).populate( { path : 'products', match: { isDeleted : false, product_quantity : { $gt : 0 } } } );
            products = brands.flatMap( brands => brands.products );
            category = 'All';
            if ( sort === 'highToLow' ) {
                products = products.sort((a, b) => b.product_price - a.product_price);
                sort = '';
            } else if ( sort === 'lowToHigh' ) {
                products = products.sort((a, b) => a.product_price - b.product_price);
                sort = ''; 
            } 
        }

        // Extract unique brand names from the product details
        const brands = await brand.find( { 'isBlocked' : false } );

        const populatedBrands = await brand.find( { 'isBlocked' : false } )
        .populate( {
            path: 'products',
            populate: {
                path: 'discount',
                model: 'Discounts'
            }
        } ).exec();
        
        const discount = populatedBrands[0].products[0].discount[0];
        
        if ( req.user ) {

            const userId = req.user.userId;

            // Fetch the user details from the database using the user ID
            const user = await userCredentials.find({ '_id' : userId });

            // Extract the username from the user details
            const username = user[0].first_name;

            // Render the 'filterPage' view, passing username, brands, and products
            res.render( 'user/filterPage', { username, brands, products, category, dir, filter, discount } );
        } else {
            // Render the 'filterPage' view, passing username, brands, and products
            res.render( 'user/filterPage', { 'username' : 'Login', brands, products, category, dir, filter, discount } );
        }
    } catch ( error ) {
        // Log the error message to the console for debugging purposes
        console.error( 'Failed to fetch data for user product filter page:', error );

        // Send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Error fetching user product filter page' );
    }
};
