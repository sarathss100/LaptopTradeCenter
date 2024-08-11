import mongoose, { Schema } from "mongoose";

// Define orderSchema
const orderSchema = new mongoose.Schema( {
    user: {
        type: Schema.Types.ObjectId,
        ref: 'userCredentials',
        required: true
    },
    products: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'products',
            required: true
        }, 
        quantity: {
            type: Number,
            required: true, 
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    shippingAddress: {
        type: Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    }, 
    timestamps: true
} );

// Create couponModel
export default Order = mongoose.model( 'Order', orderSchema );