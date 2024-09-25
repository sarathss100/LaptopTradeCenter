import dotenv from "dotenv";
dotenv.config();
import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { brands as brand } from "../../models/brandModel.mjs";
import { Cart } from "../../models/cartModel.mjs";
import {
  createPayPalOrder,
  capturePayPalOrder,
} from "../../services/paypal.mjs";
import { Wallet } from "../../models/walletModel.mjs";
import { products as productsList } from "../../models/productDetailsModel.mjs";
import { Order } from "../../models/orderModel.mjs";
import { Coupon } from "../../models/couponModel.mjs";

/**
 * Renders the user's cart page.
 * This function handles the request to display the user's shopping cart and brand information.
 *
 * @param {Object} req - The request object containing HTTP request details.
 * @param {Object} res - The response object used to send HTTP responses.
 *
 * @returns {Promise<void>} - A promise that resolves to undefined when the rendering is complete.
 */

export const userCheckOutPage = async (req, res) => {
  try {
    // Extract used ID from the request
    const userId = req.user.userId;

    const { subtotal, discounts, gst } = req.query;

    const billSummary = {
      subtotal: Number(subtotal),
      discount: Number(discounts),
      couponDeduction: 0,
      gst: Number(gst),
    };

    billSummary.grandTotal =
      billSummary.subtotal + billSummary.gst - billSummary.discount;

    const cartId = req.params.id;

    const paypalClientId = process.env.PAYPAL_CLIENT_ID;

    // Extract cart details using cart ID from database
    const cart = await Cart.findOne({ _id: cartId })
      .populate({
        path: "products.productId", // Specify the path to populate
      })
      .exec();

    const products = cart.products.map((product) => product);

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false });

    // Filtering the brands related to the products inside Cart
    const brandSorter = function (brands, products) {
      const brandsInsideCart = [];
      for (let i = 0; i < brands.length; i++) {
        for (let j = 0; j < products.length; j++) {
          if (products[j].productId.product_brand === brands[i].brand_name) {
            brandsInsideCart.push(brands[i]);
          }
        }
      }
      return brandsInsideCart;
    };

    // Brands Array Inside the Cart
    const brandsInsideCart = brandSorter(brands, cart.products);

    // Extract coupons from the coupon details
    const coupons = await Coupon.find({});

    // Filtering Coupons Applicable for Brands
    const allCouponForBrands = coupons.filter(
      (coupon) => coupon.brandSpecific.length > 0
    );

    // Filtering Coupons Applicable for Products
    const allCouponsForProducts = coupons.filter(
      (coupon) => coupon.productSpecific.length > 0
    );

    // Finding  brands coupons related to products inside the cart
    const findBrandCoupons = function (allCouponForBrands, brandsInsideCart) {
      const couponsApplicableForBrandsInsideCart = [];
      const brandsId = [];
      for (let i = 0; i < allCouponForBrands.length; i++) {
        for (let j = 0; j < allCouponForBrands[i].brandSpecific.length; j++) {
          brandsId.push(allCouponForBrands[i].brandSpecific[j]);
        }
      }

      for (let i = 0; i < brandsInsideCart.length; i++) {
        for (let j = 0; j < brandsId.length; j++) {
          if (brandsInsideCart[i]._id.toString() === brandsId[j].toString()) {
            couponsApplicableForBrandsInsideCart.push(allCouponForBrands[j]);
          }
        }
      }
      return couponsApplicableForBrandsInsideCart;
    };

    // Finding the products coupons realated to products inside the cart
    const findProductCoupons = function (
      allCouponsForProducts,
      productsInsideCart
    ) {
      const couponsApplicableForProductsInsideCart = [];
      const productId = [];
      for (let i = 0; i < allCouponsForProducts.length; i++) {
        for (
          let j = 0;
          j < allCouponsForProducts[i].productSpecific.length;
          j++
        ) {
          productId.push(allCouponsForProducts[i].productSpecific[j]);
        }
      }

      for (let i = 0; i < productsInsideCart.length; i++) {
        for (let j = 0; j < productId.length; j++) {
          if (
            productsInsideCart[i].productId._id.toString() ===
            productId[j].toString()
          ) {
            couponsApplicableForProductsInsideCart.push(
              allCouponsForProducts[j]
            );
          }
        }
      }

      return couponsApplicableForProductsInsideCart;
    };

    // Finding coupons applicable for all brands
    const couponsForAllProducts = coupons.filter(
      (coupon) => coupon.applicableToAllBrands === true
    );

    // brands coupons list
    const couponsApplicableForBrandsInsideCart = findBrandCoupons(
      allCouponForBrands,
      brandsInsideCart
    );

    // proudct coupons list
    const couponsApplicableForProductsInsideCart = findProductCoupons(
      allCouponsForProducts,
      products
    );

    // Complet coupons related to the products inside the cart
    const couponsAvailable = [
      ...couponsForAllProducts,
      ...couponsApplicableForBrandsInsideCart,
      ...couponsApplicableForProductsInsideCart,
    ];

    // If the user is authenticated, retrieve user details from the database
    const user = await userCredentials.findOne({ _id: userId });

    const wallet = await Wallet.findOne({ userId });
    const walletBalance = wallet.balance.toFixed(2);

    // Get the username from the user details
    const username = user.first_name;

    // Render the cart page with the user's username and available brands
    res.render("user/checkOutPage", {
      username,
      brands,
      user,
      billSummary,
      cart,
      products,
      paypalClientId,
      walletBalance,
      couponsAvailable,
    });
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Failed to fetch brand names for userCartPage:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Failed to render the cart page");
  }
};

// Create PayPal order route
export const createOrder = async (req, res) => {
  try {
    const { totalAmount } = req.body; // Get the total amount from the request body
    const order = await createPayPalOrder(totalAmount);
    res.json(order);
  } catch (error) {
    console.error(`Error creating PayPal order in route:`, error);
    res.status(500).send(`Failed to create PayPal order`);
  }
};

// Capture PayPal order route
export const captureOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const captureResult = await capturePayPalOrder(orderId);

    res.json(captureResult);
  } catch (error) {
    console.error(`Error capturing PayPal order in route:`, error);
    res.status(500).send(`Failed to capture PayPal order`);
  }
};

export const walletCheckOut = async function (req, res) {
  try {
    const { address, paymentMethod, billSummary, products } = req.body;
    const userId = req.user.userId;
    let paymentStatus = "Paid";
    let orderStatus = "Pending";

    const totalAmount = Number(billSummary.grandTotal);
    const paymentMode = paymentMethod;

    const orderProducts = products.map((product) => ({
      product: product.productId._id,
      quantity: product.quantity,
      price: product.price,
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

    const wallet = await Wallet.findOne({ userId });

    if (wallet) {
      wallet.balance -= totalAmount;
      wallet.transactionHistory.push({
        amount: totalAmount,
        type: "debit",
        description: "Payment for order",
      });

      await wallet.save();
    }

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
    res.status(201).json({ success: true, order: saveOrder });
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Something happened while creating wallet checkout:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};
