/**
 * Handles rendering the admin dashboard or redirecting to the login page based on the user's authentication status.
 * 
 * This function checks the presence of an `admin` object in the session to determine if the user is authenticated.
 * - If the `admin` object is present, it means the user is authenticated and the function renders the admin dashboard page.
 * - If the `admin` object is not present, it means the user is not authenticated, and the function redirects them to the login page.
 * 
 * @param {Object} req - The request object containing HTTP request details, including session data.
 * @param {Object} res - The response object used to send HTTP responses, including rendering views or redirection.
 */

// Render the admindashboard page
const adminDashBoard = (req, res) => res.render( 'admin/adminDashBoardPage' );

// Export the function to make it available for import and use in other modules
export default adminDashBoard;
