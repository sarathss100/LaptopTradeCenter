/**
 * Renders the user coupons page
 * 
 * @param {Object} req - The request object containing HTTP request details.
 * @param {Object} res - The response object used to send HTTP responses.
 *
 */

const userCouponPage = ( req, res ) => res.render( 'user/userCouponsPage' );

// This allows the function to be imported and used in other parts of the application
export default userCouponPage;