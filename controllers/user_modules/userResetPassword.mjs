import { userCredentials } from "../../models/userCredentialsModel.mjs";

// 'bcrypt' library is used for hashing and compairing passwords securely
import bcrypt from 'bcrypt';

// Define the number of salt rounds for bcrypt hashing
const saltRounds = 10;

/**
 * Renders the password reset page with any error messages from the session.
 * 
 * This asynchronous function handles rendering the password reset page for users. It retrieves any error messages
 * related to password reset from the session and clears them after retrieval. If an error occurs while rendering the page,
 * it logs the error and sends a 500 Internal Server Error response.
 * 
 * @param {Object} req - The HTTP request object containing details of the HTTP request.
 * @param {Object} res - The HTTP response object used to send responses to the client.
 * 
 * @returns {Promise<void>} This function does not return a value but renders the password reset page view or sends an error message.
 * 
 * @throws {Error} Logs an error to the console if there is an issue rendering the password reset page.
 */
export const resetPasswordPage = ( req, res ) => {
    try {
        // Retrieve any stored error messages related to password mismatch from the session
        // Default to an empty string if no errors are present
        const userPasswordDoNotMatchError = req.session.userPasswordDoNotMatchError || '';

        // Clear error messages related to password mismatch from the session
        req.session.userPasswordDoNotMatchError = '';

        // Render the password reset page view with the retrieved error messages
        res.render( 'user/userPasswordResetPage', { userPasswordDoNotMatchError } );
    } catch ( error ) {
        // Log any errors that occur during the rendering process
        console.error( 'Failed to render the reset password page:', error );

        // Send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render the password reset page' );
    }
};

/**
 * Handles the password reset form submission.
 * 
 * @param {Object} req - The request object containing HTTP request details and form data.
 * @param {Object} res - The response object used to send HTTP responses.
 * 
 * Validates the provided password and new password, hashes the new password, and updates it in the database.
 */

export const resetPasswordForm = async ( req, res ) => {
    // Extract form fields from the request body
    const { newPassword, confirmPassword } = req.body;

    try {
        
        // Validate passwords and handle errors
        if ( newPassword !== confirmPassword ) {
            // Set error messages in the session for password mismatch
            if ( newPassword !== confirmPassword ) {
                req.session.userPasswordDoNotMatchError = `Password dosen't match`;
            }
            // Redirect back to the password reset page with error messages
            res.redirect( 'passwordResetPage' );
        } else {

            // Generate a salt
            const salt = await bcrypt.genSalt( saltRounds );

            // Hash the new password using bcrypt
            const hashedUserPassword = await bcrypt.hash( newPassword, salt );

            // Update the user's password in the database with the new hashed password
            await userCredentials.updateOne( {}, { password : hashedUserPassword } );

            // Redirect to the login page after successful password reset
            res.redirect( 'loginPage' );
        } 
    } catch ( error ) {
        // Log any errors that occur during the password reset process
        console.error( error ); 
    }
};
