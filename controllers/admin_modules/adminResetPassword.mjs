import { adminCredentials } from '../../models/adminCredentialsModel.mjs';
import { adminMasterPassword } from '../../models/adminMasterPasswordModel.mjs';

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
    const adminPasswordDoNotMatchError = req.session.adminPasswordDoNotMatchError || '';
    const adminMasterPasswordError = req.session.adminMasterPasswordError || '';

    // Clear error messages from the session
    req.session.adminPasswordDoNotMatchError = '';
    req.session.adminMasterPasswordError = '';

    // Render the password reset page with the error messages
    res.render( `admin/adminPasswordResetPage`, { adminPasswordDoNotMatchError, adminMasterPasswordError } );
};

/**
 * Handles the password reset form submission.
 * 
 * @param {Object} req - The request object containing HTTP request details and form data.
 * @param {Object} res - The response object used to send HTTP responses.
 * 
 * Validates the provided master password and new password, hashes the new password, and updates it in the database.
 */

export const resetPasswordForm = async ( req, res ) => {
    // Extract form fields from the request body
    const { masterpassword, newPassword, confirmPassword } = req.body;

    try {
        // Fetch the stored hashed master password from the database
        const hashedMasterPassword = await adminMasterPassword.findOne( {} );

        // Compare the provided master password with the stored hashed master password
        const isMasterPasswordMatch = await bcrypt.compare( masterpassword, hashedMasterPassword.masterpassword );

        // Validate passwords and handle errors
        if ( !isMasterPasswordMatch || newPassword !== confirmPassword ) {
            // Set error messages in the session for invalid master password or password mismatch
            if ( !isMasterPasswordMatch ) {
                req.session.adminMasterPasswordError = `Please enter the correct master password`;
            }
            if ( newPassword !== confirmPassword ) {
                req.session.adminPasswordDoNotMatchError = `Password dosen't match`;
            }
            // Redirect back to the password reset page with error messages
            res.redirect( 'passwordResetPage' );
        } else {

            // Generate a salt
            const salt = await bcrypt.genSalt( saltRounds );

            // Hash the new password using bcrypt
            const hashedAdminPassword = await bcrypt.hash( newPassword, salt );

            // Update the admin's password in the database with the new hashed password
            await adminCredentials.updateOne( {}, { password : hashedAdminPassword } );

            // Redirect to the login page after successful password reset
            res.redirect( 'loginPage' );
        } 
    } catch ( error ) {
        // Log any errors that occur during the password reset process
        console.error( error ); 
    }
};