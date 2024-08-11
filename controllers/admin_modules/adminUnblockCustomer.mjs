import { userCredentials } from "../../models/userCredentialsModel.mjs";

/**
 * Handles the request to Unblock a customer by marking it as Unblocked.
 * This endpoint updates the `isBlocked` field of the customer to 'Unblocked', indicating it is authorized.
 * @param {Object} req - The request object containing the customer ID in the URL parameters.
 * @param {Object} res - The response object used to send a response to the client.
 */
export const unblockCustomer = async ( req, res ) => {
    try {
        // Extract the customer ID from the URL parameters
        const customerId = req.params.id;

        // Update the customer 'isBlocked' field to 'Blocked' to mark it as blocked
        await userCredentials.findByIdAndUpdate( customerId, { 'isBlocked': 'Unblocked' } );

        // Send a success response to the client indicating the customer was Unblocked successfully
        return res.status( 200 ).json( {
            success: true,
            message: `Customer with id ${ customerId } Unblocked successfully`
        } );
    } catch ( error ) {
        // Log the error for debugging purposes
        console.error( `Failed to Unblock the customer: `, error );

        // Send an error response to the client indicating the blocking failed
        return res.status( 500 ).json( {
            success: false,
            message: 'Failed to block the customer'
        } );
    }
};
