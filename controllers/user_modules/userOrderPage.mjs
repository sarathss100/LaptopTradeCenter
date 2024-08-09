/**
 * Renders the user order page.
 * 
 * This asynchronous function attempts to render the user order page. If an error occurs during rendering,
 * it logs the error and sends a 500 Internal Server Error response.
 * 
 * @param {Object} req - The HTTP request object containing details of the HTTP request.
 * @param {Object} res - The HTTP response object used to send responses to the client.
 * 
 * @returns {Promise<void>} This function does not return a value but sends an HTTP response by rendering the view or sending an error message.
 * 
 * @throws {Error} Logs an error to the console if there is an issue rendering the user order page.
 */
const userOrderPage = ( req, res ) => {
    try {
        // Attempt to render the user order page
        res.render( 'user/userOrderPage' );
    } catch ( error ) {
        // Log any errors that occur during rendering
        console.error( 'Failed to render user order page:', error );

        // Send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render user order page' );
    }
};

// This allows the function to be imported and used in other parts of the application
export default userOrderPage;
