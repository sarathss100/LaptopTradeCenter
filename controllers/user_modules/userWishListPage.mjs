import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { brands as brand } from '../../models/brandModel.mjs';
import { WishList } from '../../models/wishListModel.mjs';

/** 
 * Renders the user's wish list page.
 * This function handles the request to display the user's wish list and product information.
 * 
 * @param {Object} req - The request object containing HTTP request details.
 * @param {Object} res - The response object used to send HTTP responses.
 *
 * @returns {Promise<void>} - A promise that resolves to undefined when the rendering is complete.
 */

export const wishListPage = async ( req, res ) => {
    try {
         const userId = req.user.userId;
         if ( !userId ) {
            return res.redirect( '/user/loginPage' );
         }

        // Extract unique brand names from the product details
        const brands = await brand.find( { 'isBlocked': false } );

        const productId = req.params.id;
        const wishList = await WishList.findOne( { userId: userId } ).populate( 'wishlist' );
        const products = wishList.wishlist;
        if ( req.user ) {
            // If the user is authenticated, retrieve user details from the database
            const userId = req.user.userId;
            const user = await userCredentials.findOne( { '_id': userId } );
            
            // Get the username from the user details
            const username = user.first_name;
            
            // Render the cart page with the user's username and available brands
            res.render('user/userWishListPage', { username, brands, user, products } );
        } else {
            // If the user is not authenticated, render the cart page with 'Login' as the username
            res.render( 'user/userWishListPage', { 'username': 'Login', brands, user, products } );
        }
    } catch ( error ) {
        // Log the error message to the console for debugging purposes
        console.error( 'Failed to fetch brand names for wish list page:', error );
        
        // Optionally, send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to render the wish list page' );
    }
};

export const addProductToWishList = async ( req, res ) => {
    
    try {
         const userId = req.user.userId;
         if ( !userId ) {
            return res.redirect( '/user/loginPage' );
         }
         const productId = req.params.id;
         let wishList = await WishList.findOne( { userId: userId } );

         if ( !wishList ) {
            wishList = new WishList( {
            userId: userId,
            wishlist: [productId]
        }  );
         } else {
            if ( wishList.wishlist.includes( productId )) {
                return res.status(200).json({ message: `Product already in wishlist!` });
            }

            wishList.wishlist.push(productId);
         }

        const savedWishList = await wishList.save();

        if ( !savedWishList ) {
            return res.status(404).json({ message: `Failed to save product to wishlist`});
        }

        res.status(200).json({ message: `Product added to wishlist!` });
         
    } catch ( error ) {
        // Log the error message to the console for debugging purposes
        console.error( 'Failed to add products to wish list:', error );
        
        // Optionally, send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to add products to wish list' );
    }
};

export const removeProductFromWishList = async ( req, res ) => {
    
    try {
        const userId = req.user.userId;
        if ( !userId ) {
            return res.redirect( '/user/loginPage' );
        }
        const productId = req.params.id;
        let wishList = await WishList.findOne( { userId: userId } );

        if ( !wishList ) {
            return res.status(404).json({ message: `WishList not found`});
        };

        if ( !wishList.wishlist.includes(productId)) {
            return res.status(404).json({ message: `Product not found in wishlist`});
        }

        await WishList.updateOne(
            { userId: userId },
            { $pull: { wishlist: productId } }
        );
    
        res.status(200).json({ message: `Product removed from wishlist!` });
         
    } catch ( error ) {
        // Log the error message to the console for debugging purposes
        console.error( 'Failed to add products to wish list:', error );
        
        // Optionally, send a 500 Internal Server Error response if an error occurs
        res.status( 500 ).send( 'Failed to add products to wish list' );
    }
};