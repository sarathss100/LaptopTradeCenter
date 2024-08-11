import { products } from '../../models/productDetailsModel.mjs';

/**
 * Handles the request to delete a product by marking it as deleted.
 * This endpoint updates the `isDeleted` field of the product to true, indicating it is no longer active.
 * @param {Object} req - The request object containing the product ID in the URL parameters.
 * @param {Object} res - The response object used to send a response to the client.
 */
export const deleteProduct = async ( req, res ) => {
    try {
        // Extract the product ID from the URL parameters
        const productId = req.params.id;

        // Update the product's 'isDeleted' field to true to mark it as deleted
        await products.findByIdAndUpdate( productId, { 'isDeleted': true } );

        // Send a success response to the client indicating the product was deleted successfully
        return res.status( 200 ).json( {
            success: true,
            message: `Product with id ${ productId } deleted successfully`
        } );
    } catch ( error ) {
        // Log the error for debugging purposes
        console.error( `Failed to remove the product: `, error );

        // Send an error response to the client indicating the deletion failed
        return res.status( 500 ).json( {
            success: false,
            message: 'Failed to delete the product'
        } );
    }
};
