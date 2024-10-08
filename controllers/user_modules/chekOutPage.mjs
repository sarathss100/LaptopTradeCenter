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

    // Extract cart ID from the request
    const cartId = req.params.id;

    // Extract cart details using cart ID from database
    const cart = await Cart.findOne({ _id: cartId })
      .populate({
        path: "products.productId", // Specify the path to populate
      })
      .exec();

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

    // If the total amount is greater than per order it doesn't allow the order
    if (subtotal > 2000000) return res.redirect("/user/cartPage");

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
    

    // Discount variables
    const originalPrices = [];
    const discountedPrices = [];
    const appliedOffers = [];
    const discountedCategories = [];
    const discountedBrands = [];
    const discountedProducts = [];

    for (let i = 0; i < cart.products.length; i++) {
      originalPrices.push(cart.products[i].price * cart.products[i].quantity);
    }

    // const totalOriginalPrice = originalPrices.reduce(
    //   (acc, amount) => (acc = acc + amount),
    //   0
    // );

    // Extract offer details from the discount Model
    const discount = await Discounts.find({})
      .populate("categorySpecific")
      .populate("brandSpecific")
      .populate("productSpecific")
      .exec();

    const offerApplicableToAllProducts = discount.filter((offer) => {
      const currentDate = new Date();
      const expirationDate = new Date(offer.discount_expiration);
      if (
        offer.applicableToAllProducts === true &&
        expirationDate > currentDate
      )
        return offer;
    });

    const offerApplicableForCategory = discount.filter((offer) => {
      const currentDate = new Date();
      const expirationDate = new Date(offer.discount_expiration);
      if (
        offer.categorySpecific.length > 0 === true &&
        expirationDate > currentDate
      )
        return offer;
    });

    if (offerApplicableForCategory) {
      offerApplicableForCategory.forEach((discount) =>
        discount.categorySpecific.forEach((value) => {
          const data = {
            category: value.category_name,
            discountType: discount.type_of_discount,
            discountValue: discount.discountValue,
          };
          discountedCategories.push(data);
        })
      );
    }

    const offerApplicableForBrands = discount.filter((offer) => {
      const currentDate = new Date();
      const expirationDate = new Date(offer.discount_expiration);
      if (
        offer.brandSpecific.length > 0 === true &&
        expirationDate > currentDate
      )
        return offer;
    });

    if (offerApplicableForBrands) {
      offerApplicableForBrands.forEach((discount) =>
        discount.brandSpecific.forEach((value) => {
          const data = {
            brandName: value.brand_name,
            discountType: discount.type_of_discount,
            discountValue: discount.discountValue,
          };
          discountedBrands.push(data);
        })
      );
    }

    const offerApplicableForProducts = discount.filter((offer) => {
      const currentDate = new Date();
      const expirationDate = new Date(offer.discount_expiration);
      if (
        offer.productSpecific.length > 0 === true &&
        expirationDate > currentDate
      )
        return offer;
    });

    if (offerApplicableForProducts) {
      offerApplicableForProducts.forEach((discount) =>
        discount.productSpecific.forEach((value) => {
          const data = {
            productId: value._id,
            discountType: discount.type_of_discount,
            discountValue: discount.discountValue,
          };
          discountedProducts.push(data);
        })
      );
    }

    const calculateDiscountedPrice = function (
      productPrice,
      discountType,
      discountValue,
      discountedPrice
    ) {
      const maximumDiscountForProduct = (productPrice * 20) / 100;
      let discountedAmount = 0;
      if (discountedPrice) {
        if (discountType === "Percentage") {
          let discountAmount =
            (productPrice * discountValue) / 100 +
            (productPrice - discountedPrice);
          if (discountAmount <= maximumDiscountForProduct) {
            discountedAmount = productPrice - discountAmount;
          } else {
            discountedAmount = productPrice - maximumDiscountForProduct;
          }
        } else {
          discountValue += productPrice - discountedPrice;
          if (discountValue <= maximumDiscountForProduct) {
            discountedAmount = productPrice - discountValue;
          } else {
            discountedAmount = productPrice - maximumDiscountForProduct;
          }
        }
      } else {
        if (discountType === "Percentage") {
          let discountAmount = (productPrice * discountValue) / 100;
          if (discountAmount <= maximumDiscountForProduct) {
            discountedAmount = productPrice - discountAmount;
          } else {
            discountedAmount = productPrice - maximumDiscountForProduct;
          }
        } else {
          if (discountValue <= maximumDiscountForProduct) {
            discountedAmount = productPrice - discountValue;
          } else {
            discountedAmount = productPrice - maximumDiscountForProduct;
          }
        }
      }
      return Number(discountedAmount.toFixed());
    };

    for (const product of cart.products) {
      const productPrice = product.price * product.quantity;
      let discountedPrice = 0;
      let offersData = [];
      if (offerApplicableToAllProducts.length > 0) {
        const discountValue =
          offerApplicableToAllProducts[offerApplicableToAllProducts.length - 1]
            .discountValue;
        const discountType =
          offerApplicableToAllProducts[offerApplicableToAllProducts.length - 1]
            .type_of_discount;
        discountedPrice = calculateDiscountedPrice(
          productPrice,
          discountType,
          discountValue
        );
        if (discountType === "Percentage") {
          offersData.push(`${discountValue}% off`);
        } else {
          offersData.push(`Flat ₹${discountValue} off`);
        }
      }

      const applyOffer = function (isMatched) {
        if (discountedPrice) {
          discountedPrice = calculateDiscountedPrice(
            productPrice,
            isMatched[isMatched.length - 1].discountType,
            isMatched[isMatched.length - 1].discountValue,
            discountedPrice
          );
        } else {
          discountedPrice = calculateDiscountedPrice(
            productPrice,
            isMatched[isMatched.length - 1].discountType,
            isMatched[isMatched.length - 1].discountValue
          );
        }
        if (isMatched[isMatched.length - 1].discountType === "Percentage") {
          offersData.push(
            `${isMatched[isMatched.length - 1].discountValue}% off`
          );
        } else {
          offersData.push(
            `Flat ₹${isMatched[isMatched.length - 1].discountValue} off`
          );
        }
      };

      if (discountedCategories.length > 0) {
        const isMatched = discountedCategories.filter(
          (category) => category.category === product.productId.usage
        );

        if (isMatched.length > 0) {
          applyOffer(isMatched);
        }
      }

      if (discountedBrands.length > 0) {
        const isMatched = discountedBrands.filter(
          (brand) => brand.brandName === product.productId.product_brand
        );

        if (isMatched.length > 0) {
          applyOffer(isMatched);
        }
      }

      if (discountedProducts.length > 0) {
        const isMatched = discountedProducts.filter(
          (products) =>
            products.productId.toString() === product.productId._id.toString()
        );

        if (isMatched.length > 0) {
          applyOffer(isMatched);
        }
      }

      appliedOffers.push(offersData);
      discountedPrices.push(discountedPrice);
    }

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
    const orderId = req.body.orderId || "";

    if (orderId) {
      let existingOrder = {};

      if (orderId) {
      // Check if there's an existing unpaid order
        existingOrder = await Order.findOne({
       _id: orderId
     });
    }
      const totalDiscountedPrice = existingOrder.products.reduce((acc, product) => {
        if (product.orderStatus !== "Cancelled") {
          acc += (product.discountedPrice + product.gst);
        }
        return acc;
      }, 0);

      const totalAmount = totalDiscountedPrice - existingOrder.couponDeduction;
      const order = await createPayPalOrder(totalAmount);
      res.json(order);
    
    } else {
      const order = await createPayPalOrder(totalAmount);
      res.json(order);
    }
    
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

    const totalAmount = billSummary.grandTotal;
    const paymentMode = paymentMethod;

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
    res.status(201).json({ success: true, order: order });
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Something happened while creating wallet checkout:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};
