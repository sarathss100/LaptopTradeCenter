// 'collection' module contains Mongoose models for interacting with MongoDB
import * as collection from '../../models/mongodb.mjs';
// 'bcrypt' library is used for hashing and compairing passwords securely
import bcrypt from 'bcrypt';

// Define the number of salt rounds for bcrypt hashing
const saltRounds = 10;

/**
 * Renders the password reset page with any error messages from the session.
 * 
 * @param {Object} req - The request object containing HTTP request details.
 * @param {Object} res - The response object used to send HTTP responses.
 * 
 * Retrieves error messages from the session, clears them, and renders the password reset page.
 */

export const resetPasswordPage = ( req, res ) => {
    // Retrieve any stored error messages from the session
    // Default to an empty string if no errors are present
    const userPasswordDoNotMatchError = req.session.adminPasswordDoNotMatchError || '';

    // Clear error messages from the session
    req.session.userPasswordDoNotMatchError = '';

    // Render the password reset page with the error messages
    res.render( `user/userPasswordResetPage`, { userPasswordDoNotMatchError } );
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
            await collection.userCredentialsModel.updateOne( {}, { password : hashedUserPassword } );

            // Redirect to the login page after successful password reset
            res.redirect( 'loginPage' );
        } 
    } catch ( error ) {
        // Log any errors that occur during the password reset process
        console.error( error ); 
    }
};
