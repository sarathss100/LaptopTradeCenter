import { userCredentialsModel } from "../../models/mongodb.mjs";

/**
 * Handles the rendering of the products page with paginated product details.
 * 
 * This asynchronous function retrieves a paginated list of customers from the database and renders the customer list page. 
 * It supports pagination by using `page` and `limit` query parameters from the request. If these parameters are not provided,
 * default values are used (page 1 and limit 10). The function calculates the total number of pages based on the number of 
 * customers and the specified limit, and passes this information along with the current page and customers to the view for rendering.
 * 
 * @param {Object} req - The HTTP request object, which includes query parameters for pagination.
 * @param {Object} res - The HTTP response object, used to render the view with the customers and pagination details.
 * 
 * @returns {void} This function does not return a value but sends an HTTP response by rendering the view.
 * 
 * @throws {Error} Logs an error to the console if there is an issue fetching the product data from the database.
 * 
 */

export const customersListPage = async ( req, res ) => {

    // Extract page number and limit from query parameters with default values
    const page = parseInt( req.query.page ) || 1;
    const limit = parseInt( req.query.limit ) || 10;

    try {
        // Get the total count of customers that are not marked as deleted
        const count = await userCredentialsModel.countDocuments( { 'isDeleted': false } );

        // Fetch the products for the current page with pagination
        let customers = await userCredentialsModel.find( { 'isDeleted': false } )
        .skip( ( page - 1 ) * limit )
        .limit( limit );

        // Render the customer list page with customers, current page, and total pages
        res.render( 'admin/adminCustomersPage', { 
            customers,
            currentPage: page,
            totalPages: Math.ceil( count / limit ) 
        } );

    } catch ( error ) {
        // Log any errors encountered during the data fetching process
        console.error('Failed to fetch the data:', error);
    }
};
