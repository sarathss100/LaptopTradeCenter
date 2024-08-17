import mongoose, { Schema } from "mongoose";

/**
 * @typedef {Object} WishList
 * @property {ObjectId[]} wishlist - An array of references to Product documents.
 */

/**
 * Schema definition for the WishList model.
 * 
 * @constant {Schema} wishListSchema - Defines the structure of the WishList document.
 * @property {ObjectId[]} wishlist - An array of references to Product documents. Each element is an ObjectId referencing a product.
 */
const wishListSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'userCredentials' },
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'products' }]
});

/**
 * WishList model represents the WishList collection in MongoDB.
 * 
 * @constant {Model} WishList - The Mongoose model for WishList schema. 
 * @description This model is used to interact with the WishList collection in the MongoDB database. It allows querying and updating wishlists and their associated products.
 */
export const WishList = mongoose.model('WishList', wishListSchema);
