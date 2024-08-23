import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { products as productsList } from '../../models/productDetailsModel.mjs';
import { brands as brand } from '../../models/brandModel.mjs';
import { Order } from '../../models/orderModel.mjs';

/** 
 * Renders the user's cart page.
 * This function handles the request to display the user's shopping cart and brand information.
 * 
 * @param {Object} req - The request object containing HTTP request details.
 * @param {Object} res - The response object used to send HTTP responses.
 *
 * @returns {Promise<void>} - A promise that resolves to undefined when the rendering is complete.
 */

export const userOrderPage = async ( req, res ) => {
    try { 
        // Retrieve product brand details from the database
        const products = await productsList.find( { } );
        
        // Extract unique brand names from the product details
        const brands = await brand.find( { 'isBlocked' : false } );
        
        if ( req.user ) {
            // If the user is authenticated, retrieve user details from the database
            const userId = req.user.userId;

            const user = await userCredentials.findOne( { '_id': userId } );
            
            const orderDetails = await Order.find( { user: userId } )
            .populate({
                path: 'products.product',
                model: 'products'
            })
            .exec();

            for ( let i = 0; i < orderDetails.length; i++ ) {
                // console.log( orderDetails[i] ); 
                for ( let j = 0; j < orderDetails[i].products.length; j++ ) {
                    console.log(`Product Details`);
                    console.log( orderDetails[i].products[j].product.product_name)
                }
            }

            let address;

            if ( orderDetails ) {
                const addressId = orderDetails[0].shippingAddress || '';
            
                if ( addressId ) {
                    address = await userCredentials.findOne( { '_id': userId, "address._id": addressId }, { 'address.$': 1 } );
                }
            }
            
            // Get the username from the user details
            const username = user.first_name;
            
            // Render the cart page with the user's username and available brands
            res.render('user/orderPage', { username, brands, user, products, orderDetails } );
        } else {
            // If the user is not authenticated, render the cart page with 'Login' as the username
            res.render( 'user/orderPage', { 'username': 'Login', brands, user, products, orderDetails } );
        }
    } catch ( error ) {
        // Log the error message to the console for debugging purposes
        console.error( 'Failed to fetch brand names for userCartPage:', error );
        
        // Optionally, send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render the cart page' );
    }
};


export const addOrderDetails = async ( req, res ) => {
    try {
        const { address, paymentMethod, billSummary, products } = req.body;
        const userId = req.user.userId;

        const orderProducts = products.map( product => ({
            product: product.productId,
            quantity: product.quantity,
            price: product.price
        }));

        const totalAmount = Number(billSummary.grandTotal);
        const paymentMode = paymentMethod;
        let paymentStatus = 'Pending';
        let orderStatus = 'Pending'
        if ( paymentMethod === 'cod' ) {
            paymentStatus = 'Paid'
            orderStatus = 'Processing'
        }

        const shippingAddress = address._id;

        // Process the order here, such as saving it to the database or performing payment operations
        const newOrder = new Order({
            user: userId,
            products: orderProducts,
            totalAmount,
            paymentMode,
            paymentStatus,
            orderStatus,
            shippingAddress
        });

        // Save the new order to the database
        const saveOrder = await newOrder.save();

        // Respond with the saved order
        res.status(201).json({ success: true, order: saveOrder });
    } catch ( error ) {
        // Log the error message to the console for debugging purposes
        console.error( 'Error creating new order:', error );
        
        // Optionally, send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).json({ success: false, message: "Failed to create order"});
    }
};
