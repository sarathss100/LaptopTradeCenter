import dotenv from "dotenv";
dotenv.config();
import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { products as productsList } from "../../models/productDetailsModel.mjs";
import { brands as brand } from "../../models/brandModel.mjs";
import { Order } from "../../models/orderModel.mjs";
import { Cart } from "../../models/cartModel.mjs";
import { Wallet } from "../../models/walletModel.mjs";

/**
 * Renders the user's cart page.
 * This function handles the request to display the user's shopping cart and brand information.
 *
 * @param {Object} req - The request object containing HTTP request details.
 * @param {Object} res - The response object used to send HTTP responses.
 *
 * @returns {Promise<void>} - A promise that resolves to undefined when the rendering is complete.
 */
export const userOrderPage = async (req, res) => {
  try {
    // Retrieve product brand details from the database
    const products = await productsList.find({});

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false });

    if (req.user) {
      // If the user is authenticated, retrieve user details from the database
      const userId = req.user.userId;

      const user = await userCredentials.findOne({ _id: userId });

      const orderDetails = await Order.find({ user: userId })
        .populate({
          path: "products.product",
          model: "products",
        })
        .sort({ createdAt: -1 })
        .exec();

      // Get the username from the user details
      const username = user.first_name;

      const wallet = await Wallet.findOne({ userId });

      let walletBalance = 0;
      if (wallet) {
        walletBalance = wallet.balance.toFixed(2);
      }

      // Extract the paypal client from the env file
     const paypalClientId = process.env.PAYPAL_CLIENT_ID;

      // Render the cart page with the user's username and available brands
      res.render("user/orderPage", {
        username,
        brands,
        user,
        products,
        orderDetails,
        walletBalance,
        paypalClientId
      });
    }
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Failed to fetch brand names for userCartPage:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(404).render('404', { title: "Route not found"});
  }
};

export const addOrderDetails = async (req, res) => {
  try {
    const { address, paymentMethod, billSummary, products } = req.body;
    const userId = req.user.userId;
    let paymentStatus = "Pending";
    let orderStatus = "Pending";

    const totalAmount = Number(billSummary.grandTotal);
    const paymentMode = paymentMethod;

    if (paymentMethod === "cod") {
      paymentStatus = "Pending";
      orderStatus = "Processing";
    }

    if (paymentMethod === "upi") {
      paymentStatus = "Paid";
      orderStatus = "Processing";
    }

    if (paymentMethod === "wallet") {
      paymentStatus = "Paid";
      orderStatus = "Processing";
    }

    const orderProducts = products.map((product) => ({
      product: product.productId._id,
      quantity: product.quantity,
      price: product.price,
      discountedPrice: product.discountedPrice,
      discountValue: product.discountValue,
      gst: product.gst,
      orderStatus,
    }));

    if (orderProducts) {
      for (let i = 0; i < orderProducts.length; i++) {
        const product = await productsList.findById(orderProducts[i].product);

        // Check if the product has enough stock
        if (product.product_quantity >= orderProducts[i].quantity) {
          // Reduce the quantity
          await productsList.findByIdAndUpdate(
            { _id: orderProducts[i].product },
            { $inc: { product_quantity: -orderProducts[i].quantity } },
            { new: true }
          );
        } else {
          console.error(`Insufficient stock for product:`);
        }
      }
    }

    const shippingAddress = address;
    const discountDeduction = billSummary.discount;
    const couponDeduction = billSummary.couponDeduction;

    // Process the order here, such as saving it to the database or performing payment operations
    const newOrder = new Order({
      user: userId,
      products: orderProducts,
      totalAmount,
      discountDeduction,
      couponDeduction,
      paymentMode,
      paymentStatus,
      orderStatus,
      shippingAddress,
    });

    // Save the new order to the database
    const saveOrder = await newOrder.save();

    // Extract order id from savedOrder
    const orderId = saveOrder._id;

    // Populate the order
    const order = await Order.findOne({ _id: orderId })
      .populate({ path: "user", model: "userCredentials" })
      .populate({ path: "products.product", model: "products" });

    // Clear the cart after checkout
    const updatedCart = await Cart.findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          products: [],
          totalAmount: 0,
        },
      },
      { new: true }
    );

    // Respond with the saved order
    res.status(201).json({ success: true, order: order });
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Error creating new order:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const wallet = await Wallet.find({ userId: userId });

    const orderId = req.params.id;
    const productId = req.query.productId;

    const orderDetails = await Order.findOne({ _id: orderId });

    const cancelledProduct = orderDetails.products.filter((product) => {
      if (product._id.toString() === productId) return product;
    });

    const couponValue =
      orderDetails.couponDeduction / orderDetails.products.length || 0;

    const refundAmount =
      cancelledProduct[0].discountedPrice * cancelledProduct[0].quantity +
      cancelledProduct[0].gst -
      couponValue;

    const paymentStatus = orderDetails.paymentStatus;

    if (paymentStatus === "Paid") {
      wallet[0].balance += refundAmount;
      wallet[0].transactionHistory.push({
        amount: refundAmount,
        type: "credit",
        description: "Refund for canceled order",
      });

      await wallet[0].save();
    }

    const orderStatus = await Order.updateOne(
      {
        _id: orderId,
        "products._id": productId,
      },
      {
        $set: { "products.$.orderStatus": "Cancelled" },
      }
    );

    if (!orderStatus) return res.status(500).json({ success: false });
    return res.json({ success: true });
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Error cancelling the order:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res
      .status(500)
      .json({ success: false, message: "Failed cancel the create order" });
  }
};

export const updateQty = async (req, res) => {
  try {
    const { productId, cartId, actualProductId, incrementQty } = req.body;

    let quantity = req.body.quantity;

    const product = await productsList.findOne({ _id: actualProductId });
    let productQuantityLeft = product.product_quantity;

    if (productQuantityLeft > 1 || incrementQty === false) {
      if (incrementQty) {
        productQuantityLeft--;
        const updateStock = await productsList.updateOne(
          { _id: actualProductId },
          { $set: { product_quantity: productQuantityLeft } }
        );
        quantity++;
        const cart = await Cart.updateOne(
          {
            _id: cartId,
            "products._id": productId,
          },
          {
            $set: { "products.$.quantity": quantity },
          }
        );
        if (!cart)
          return res
            .status(500)
            .json({ success: false, message: "Something went wrong" });
      } else {
        productQuantityLeft++;
        const updateStock = await productsList.updateOne(
          { _id: actualProductId },
          { $set: { product_quantity: productQuantityLeft } }
        );
        quantity--;
        const cart = await Cart.updateOne(
          {
            _id: cartId,
            "products._id": productId,
          },
          {
            $set: { "products.$.quantity": quantity },
          }
        );
        if (!cart)
          return res
            .status(500)
            .json({ success: false, message: "Something went wrong" });
      }

      return res.json({ success: true, productQuantity: quantity });
    } else {
      return res.status(500).json({
        success: false,
        message: `Sorry, there is not enough stock left for this product.`,
      });
    }
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Error cancelling the order:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res
      .status(500)
      .json({ success: false, message: "Failed cancel the create order" });
  }
};


export const updatePaymentStatus = async (req, res) => {
  const orderId = req.body.orderId;
  try {

    const updateOrderStatus = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          paymentStatus: "Paid",
          paymentMode: "upi"
        }
      }, 
      { new: true }
    );

    if (!updateOrderStatus) {
      return res.status(404).json({ message: `Order not found` });
    }

    // Sending the success response
    return res.status(200).json({
      message: `Order updated successfully`,
    });
  } catch (error) {
    // Sending error message
    return res.status(500).json({
      message: "Error updating order",
      error: error.message
    });
  }
};