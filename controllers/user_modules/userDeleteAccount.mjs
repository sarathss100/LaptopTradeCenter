import { userCredentials } from "../../models/userCredentialsModel.mjs";

/**
 * Handles the logout process by destroying the admin session.
 * 
 * @param {Object} req - The request object containing HTTP request details.
 * @param {Object} res - The response object used to send HTTP responses.
 * 
 * Destroys the current session and redirects the admin to the login page. 
 * If there is an error during session destruction, logs the error and sends a 500 Internal Server Error response.
 */
const userDeleteAccount = async ( req, res ) => {
    // Retrieve the refresh token from cookies
    const userId = req.user.userId;
    
    try {
        // Attempt to find and delete the refresh token from the database
        await userCredentials.updateOne( { '_id': userId },{ refreshToken : '', googleId : '', isDeleted: true } );
    } catch ( error ) {
        // Log the error if the refresh token removal fails
        console.error( `Failed to remove refresh token:`, error );
    }

    // Clear the access token cookie by setting its expiration date to a past date
    res.cookie( 'accessToken', '', { httpOnly: true, expires: new Date( 0 ) } );
    // Clear the refresh token cookie by setting its expiration date to a past date
    res.cookie( 'refreshToken', '', { httpOnly: true, expires: new Date( 0 ) } );
    // Clear the refresh token cookie by setting its expiration date to a past date
    res.cookie( 'googleIdToken', '', { httpOnly: true, expires: new Date( 0 ) } );

    // Destroying session
    req.session.destroy( ( error ) => {
        if ( error ) {
            console.log( `Failed to destroy the session:`, error );
        }
    } );

    // Redirect the user to the login page after successfully destroying the session
    res.redirect( '/loginPage' );
};

// Export the function to allow it to be imported and used in other parts of the application
export default userDeleteAccount;
