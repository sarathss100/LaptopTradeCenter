/**
 * Handles rendering the admin dashboard or redirecting to the login page based on the user's authentication status.
 * 
 * This function checks the presence of an `admin` object in the session to determine if the user is authenticated.
 * - If the `admin` object is present, it means the user is authenticated and the function renders the admin dashboard page.
 * - If the `admin` object is not present, it means the user is not authenticated, and the function redirects them to the login page.
 * 
 * @param {Object} req - The HTTP request object containing HTTP request details, including session data.
 * @param {Object} res - The HTTP response object used to send HTTP responses, including rendering views or redirection.
 * 
 * @returns {void} This function does not return a value but either renders the admin dashboard view or sends an error message.
 * 
 * @throws {Error} Logs an error to the console if there is an issue rendering the admin dashboard page.
 */
const adminDashBoard = ( req, res ) => {
    try {
        // Render the admin dashboard page
        res.render( 'admin/adminDashBoardPage' );
    } catch ( error ) {
        // Log any errors that occur during the rendering process
        console.error( 'Failed to render the admin dashboard:', error );

        // Send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render the admin dashboard' );
    }
};

// Export the function to make it available for import and use in other modules
export default adminDashBoard;
