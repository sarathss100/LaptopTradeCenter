/**
 * Renders the user coupons page.
 * This function handles the request to display the coupons available to the user.
 * 
 * @param {Object} req - The request object containing HTTP request details.
 * @param {Object} res - The response object used to send HTTP responses.
 *
 * @returns {Promise<void>} - A promise that resolves to undefined when the rendering is complete.
 */

const userCouponPage = ( req, res ) => {
    try {
        // Render the 'userCouponsPage' view for the user
        res.render( 'user/userCouponsPage' );
    } catch ( error ) {
        // Log the error message to the console for debugging purposes
        console.error( 'Failed to render Coupon page:', error );
        
        // Send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render the coupon page' );
    }
};

// Export the function as the default export, allowing it to be imported and used in other parts of the application
export default userCouponPage;
