import { userCredentialsModel } from "../../models/mongodb.mjs";

/**
 * Handles the request to block a customer by marking it as blocked.
 * This endpoint updates the `isBlocked` field of the customer to 'Blocked', indicating it is no longer authorized.
 * @param {Object} req - The request object containing the customer ID in the URL parameters.
 * @param {Object} res - The response object used to send a response to the client.
 */
export const blockCustomer = async ( req, res ) => {
    try {
        // Extract the customer ID from the URL parameters
        const customerId = req.params.id;

        // Update the customer 'isBlocked' field to 'Blocked' to mark it as blocked
        await userCredentialsModel.findByIdAndUpdate( customerId, { 'isBlocked': 'Blocked' } );

        // Send a success response to the client indicating the customer was blocked successfully
        return res.status( 200 ).json( {
            success: true,
            message: `Customer with id ${ customerId } deleted successfully`
        } );
    } catch ( error ) {
        // Log the error for debugging purposes
        console.error( `Failed to block the customer: `, error );

        // Send an error response to the client indicating the blocking failed
        return res.status( 500 ).json( {
            success: false,
            message: 'Failed to block the customer'
        } );
    }
};
