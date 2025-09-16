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
import { Discounts } from "../../models/discountModel.mjs";

const isExpired = function (expirationDate) {
  // Convert the expirationDate string to a Date object
  const expirationDateTime = new Date(expirationDate);

  // Get the current Date and Time
  const currentDate = new Date();

  // Compare the dates
  return currentDate >= expirationDateTime;
};

/**
 * Renders the user's checkout page with address validation.
 */
export const userCheckOutPage = async (req, res) => {
  try {
    // Extract user ID from the request
    const userId = req.user.userId;

    // Extract cart ID from the request
    const cartId = req.params.id;

    // Get user details first to check address availability
    const user = await userCredentials.findOne({ _id: userId });
    
    if (!user) {
      return res.status(404).render('404', { title: "User not found" });
    }

    // Check if user has any addresses
    // if (!user.address || user.address.length === 0) {
    //   // Redirect to add address page or show error
    //   return res.render("user/noAddressCheckout", {
    //     username: user.first_name,
    //     message: "Please add a delivery address before proceeding with checkout."
    //   });
    // }

    // Extract cart details using cart ID from database
    const cart = await Cart.findOne({ _id: cartId })
      .populate({
        path: "products.productId", // Specify the path to populate
      })
      .exec();

    if (!cart || cart.products.length === 0) {
      return res.redirect("/cartPage");
    }

    // Filtering out the products from the cart details
    const products = cart.products.map((product) => product);

    // Calculate the subtotal for billSummary
    const subtotal = products.reduce(
      (acc, product) => (acc += product.price),
      0
    );

    // Calculate the Total Discount for billSummary
    const totalDiscount = products.reduce(
      (acc, product) => (acc += product.discountValue),
      0
    );

    // Calculate the Total gst for billSummary
    const gstTotal = products.reduce((acc, product) => (acc += product.gst), 0);

    // If the total amount is greater than per order limit, don't allow the order
    if (subtotal > 2000000) {
      return res.redirect("/cartPage?error=order_limit_exceeded");
    }

    // Saving Details into the bill Summary
    const billSummary = {
      subtotal: subtotal,
      discount: totalDiscount,
      couponDeduction: 0,
      gst: gstTotal,
    };

    // Calculating the grandTotal
    billSummary.grandTotal =
      billSummary.subtotal + billSummary.gst - billSummary.discount;

    // Extract the paypal client from the env file
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;

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

    // Finding brands coupons related to products inside the cart
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

    // Finding the products coupons related to products inside the cart
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

    // product coupons list 
    const couponsApplicableForProductsInsideCart = findProductCoupons(
      allCouponsForProducts,
      products
    );

    // Complete coupons related to the products inside the cart
    let couponsAvailable = [
      ...couponsForAllProducts,
      ...couponsApplicableForBrandsInsideCart,
      ...couponsApplicableForProductsInsideCart,
    ];

    if (couponsAvailable) {
      couponsAvailable = couponsAvailable.filter((coupon) => {
        if (coupon) {
          if (!isExpired(coupon.coupon_expiration)) return coupon;
        }
      });
    }

    // Get wallet balance
    const wallet = await Wallet.findOne({ userId });
    let walletBalance = 0;
    if (wallet) {
      walletBalance = wallet.balance.toFixed(2);
    }
    
    // Get the username from the user details
    const username = user.first_name;

    // Render the checkout page with all necessary data
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
    console.error("Failed to load checkout page:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).render('500', { title: "Server Error", error: error.message });
  }
};

// Create PayPal order route
export const createOrder = async (req, res) => {
  try {
    const { totalAmount } = req.body;
    const orderId = req.body.orderId || "";

    if (orderId) {
      let existingOrder = await Order.findOne({ _id: orderId });
      
      if (!existingOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      const totalDiscountedPrice = existingOrder.products.reduce((acc, product) => {
        if (product.orderStatus !== "Cancelled") {
          acc += (product.discountedPrice + product.gst);
        }
        return acc;
      }, 0);

      const calculatedTotal = totalDiscountedPrice - existingOrder.couponDeduction;
      const order = await createPayPalOrder(calculatedTotal);
      res.json(order);
    } else {
      const order = await createPayPalOrder(totalAmount);
      res.json(order);
    }
    
  } catch (error) {
    console.error(`Error creating PayPal order:`, error);
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
};

// Capture PayPal order route
export const captureOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const captureResult = await capturePayPalOrder(orderId);
    res.json(captureResult);
  } catch (error) {
    console.error(`Error capturing PayPal order:`, error);
    res.status(500).json({ error: "Failed to capture PayPal order" });
  }
};

// Main checkout processing
export const processCheckout = async (req, res) => {
  try {
    const { address, paymentMethod, billSummary, products } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!address || !paymentMethod || !billSummary || !products) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required checkout information" 
      });
    }

    // Validate address
    if (!address || Object.keys(address).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide a delivery address" 
      });
    }

    // Validate required address fields
    const requiredAddressFields = ['address_line_1', 'city', 'state', 'country', 'zip_code'];
    const missingAddressFields = requiredAddressFields.filter(field => !address[field]);
    
    if (missingAddressFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required address fields: ${missingAddressFields.join(', ')}` 
      });
    }

    // Validate products
    if (!products || products.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No products in order" 
      });
    }

    // Set order status based on payment method
    let paymentStatus = paymentMethod === "cod" ? "Pending" : "Paid";
    let orderStatus = "Pending";

    const totalAmount = billSummary.grandTotal;
    const paymentMode = paymentMethod;

    // Validate COD amount limit
    if (paymentMethod === "cod" && totalAmount > 25000) {
      return res.status(400).json({
        success: false,
        message: "Cash on Delivery is not available for orders above ₹25,000. Please choose another payment method."
      });
    }

    // Create order products array
    const orderProducts = products.map((product) => ({
      product: product.productId._id,
      quantity: product.quantity,
      price: product.price,
      discountedPrice: product.discountedPrice,
      discountValue: product.discountValue,
      gst: product.gst,
      orderStatus,
    }));

    // Check and update product quantities
    for (let i = 0; i < orderProducts.length; i++) {
      const product = await productsList.findById(orderProducts[i].product);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${orderProducts[i].product}`
        });
      }

      // Check if the product has enough stock
      if (product.product_quantity < orderProducts[i].quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.product_name}. Available: ${product.product_quantity}, Requested: ${orderProducts[i].quantity}`
        });
      }

      // Reduce the quantity
      await productsList.findByIdAndUpdate(
        { _id: orderProducts[i].product },
        { $inc: { product_quantity: -orderProducts[i].quantity } },
        { new: true }
      );
    }

    const shippingAddress = address;
    const discountDeduction = billSummary.discount;
    const couponDeduction = billSummary.couponDeduction;

    // Create and save the order
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

    const savedOrder = await newOrder.save();

    // Populate the order for response
    const order = await Order.findOne({ _id: savedOrder._id })
      .populate({ path: "user", model: "userCredentials" })
      .populate({ path: "products.product", model: "products" });

    // Clear the cart after successful order
    await Cart.findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          products: [],
          totalAmount: 0,
        },
      },
      { new: true }
    );

    // Respond with success
    res.status(201).json({ success: true, order: order });

  } catch (error) {
    console.error("Error processing checkout:", error);
    res.status(500).json({ success: false, message: "Failed to process order" });
  }
};

// Wallet checkout processing
export const walletCheckOut = async function (req, res) {
  try {
    const { address, paymentMethod, billSummary, products } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!address || !paymentMethod || !billSummary || !products) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required checkout information" 
      });
    }

    // Validate address
    if (!address || Object.keys(address).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide a delivery address" 
      });
    }

    // Validate required address fields
    const requiredAddressFields = ['address_line_1', 'city', 'state', 'country', 'zip_code'];
    const missingAddressFields = requiredAddressFields.filter(field => !address[field]);
    
    if (missingAddressFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required address fields: ${missingAddressFields.join(', ')}` 
      });
    }

    const totalAmount = billSummary.grandTotal;

    // Check wallet balance
    const wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      return res.status(400).json({ 
        success: false, 
        message: "Wallet not found. Please contact support." 
      });
    }

    if (wallet.balance < totalAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient wallet balance. Available: ₹${wallet.balance.toFixed(2)}, Required: ₹${totalAmount.toFixed(2)}` 
      });
    }

    let paymentStatus = "Paid";
    let orderStatus = "Pending";
    const paymentMode = "wallet";

    // Create order products array
    const orderProducts = products.map((product) => ({
      product: product.productId._id,
      quantity: product.quantity,
      price: product.price,
      discountedPrice: product.discountedPrice,
      discountValue: product.discountValue,
      gst: product.gst,
      orderStatus,
    }));

    // Check and update product quantities
    for (let i = 0; i < orderProducts.length; i++) {
      const product = await productsList.findById(orderProducts[i].product);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${orderProducts[i].product}`
        });
      }

      // Check if the product has enough stock
      if (product.product_quantity < orderProducts[i].quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.product_name}. Available: ${product.product_quantity}, Requested: ${orderProducts[i].quantity}`
        });
      }

      // Reduce the quantity
      await productsList.findByIdAndUpdate(
        { _id: orderProducts[i].product },
        { $inc: { product_quantity: -orderProducts[i].quantity } },
        { new: true }
      );
    }

    const shippingAddress = address;
    const discountDeduction = billSummary.discount;
    const couponDeduction = billSummary.couponDeduction;

    // Create and save the order
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

    const savedOrder = await newOrder.save();

    // Populate the order for response
    const order = await Order.findOne({ _id: savedOrder._id })
      .populate({ path: "user", model: "userCredentials" })
      .populate({ path: "products.product", model: "products" });

    // Deduct amount from wallet
    wallet.balance -= totalAmount;
    wallet.transactionHistory.push({
      amount: totalAmount,
      type: "debit",
      description: `Payment for order #${savedOrder._id}`,
    });

    await wallet.save();

    // Clear the cart after successful order
    await Cart.findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          products: [],
          totalAmount: 0,
        },
      },
      { new: true }
    );

    // Respond with success
    res.status(201).json({ success: true, order: order });

  } catch (error) {
    console.error("Error processing wallet checkout:", error);
    res.status(500).json({ success: false, message: "Failed to process wallet payment" });
  }
};

// Apply coupon
export const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.user.userId;

    if (!couponCode) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    // Find the coupon
    const coupon = await Coupon.findOne({ coupon_code: couponCode });

    if (!coupon) {
      return res.status(400).json({ success: false, message: "Invalid coupon code" });
    }

    // Check if coupon is expired
    if (isExpired(coupon.coupon_expiration)) {
      return res.status(400).json({ success: false, message: "Coupon has expired" });
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: "Coupon usage limit exceeded" });
    }

    // Get user's cart to calculate discount
    const cart = await Cart.findOne({ userId })
      .populate({ path: "products.productId" })
      .exec();

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Calculate discount based on coupon type and applicability
    let discountAmount = 0;
    const subtotal = cart.products.reduce((acc, product) => acc + product.price, 0);

    if (coupon.type_of_discount === "Percentage") {
      discountAmount = (subtotal * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    // Apply maximum discount limit if specified
    if (coupon.maximum_discount_amount && discountAmount > coupon.maximum_discount_amount) {
      discountAmount = coupon.maximum_discount_amount;
    }

    // Check minimum order amount
    if (coupon.minimum_order_amount && subtotal < coupon.minimum_order_amount) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum order amount of ₹${coupon.minimum_order_amount} required for this coupon` 
      });
    }

    // Calculate new totals
    const totalDiscount = cart.products.reduce((acc, product) => acc + product.discountValue, 0);
    const gstTotal = cart.products.reduce((acc, product) => acc + product.gst, 0);
    const newGrandTotal = subtotal + gstTotal - totalDiscount - discountAmount;

    res.json({
      success: true,
      totalOriginalPrice: new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 }).format(subtotal.toFixed()),
      discountDeduction: new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 }).format(totalDiscount.toFixed()),
      couponDeduction: new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 }).format(discountAmount.toFixed()),
      gst: gstTotal.toFixed(),
      totalDiscountedPrice: newGrandTotal.toFixed(2)
    });

  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ success: false, message: "Failed to apply coupon" });
  }
};