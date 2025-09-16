import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { products as productsList } from "../../models/productDetailsModel.mjs";
import { brands as brand } from "../../models/brandModel.mjs";
import { Cart } from "../../models/cartModel.mjs";
import { Coupon } from "../../models/couponModel.mjs";
import { Discounts } from "../../models/discountModel.mjs";
import { WishList } from "../../models/wishListModel.mjs";

const isExpired = function (expirationDate) {
  const expirationDateTime = new Date(expirationDate);

  const currentDate = new Date();

  return currentDate >= expirationDateTime; 
};

export const userCartPage = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Retrieve product brand details from the database
    const products = await productsList.find({ isDeleted: false });

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false });

    // Extract cartDetails from the Database
    let cart = await Cart.findOne({ userId: userId })
      .populate({
        path: "products.productId", // Specify the path to populate
      })
      .exec();

    if (!cart) {
      cart = new Cart({userId: userId});
      await cart.save();
    }

    const wishList = await WishList.findOne({ userId: userId }).populate(
      "wishlist"
    );

    let productIdsInWishlist = [];
    if (wishList) {
      productIdsInWishlist = wishList.wishlist.map((product) => product._id.toString());
    }

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
    
    // Products Array Inside the Cart
    const productsInsideCart = cart.products;

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
      productsInsideCart
    );

    // Complet coupons related to the products inside the cart
    const couponsAvailable = [
      ...couponsForAllProducts,
      ...couponsApplicableForBrandsInsideCart,
      ...couponsApplicableForProductsInsideCart,
    ];

    // Discount variables
    const originalPrices = [];
    const discountedPrices = [];
    const appliedOffers = [];
    const discountedCategories = [];
    const discountedBrands = [];
    const discountedProducts = [];
    const discountedValues = [];
    const gst = [];

    for (let i = 0; i < cart.products.length; i++) {
      originalPrices.push(cart.products[i].price * cart.products[i].quantity);
    }

    const totalOriginalPrice = originalPrices.reduce(
      (acc, amount) => (acc = acc + amount),
      0
    );

    const currentDate = new Date();
    // Extract offer details from the discount Model
    const discount = await Discounts.find({
      discount_expiration: { $gte: currentDate },
    })
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

    // Corrected calculateDiscountedPrice function
    const calculateDiscountedPrice = function (
      originalPrice,
      discountType,
      discountValue,
      currentDiscountedPrice = null
    ) {
      const maximumDiscountForProduct = (originalPrice * 20) / 100;
      let basePrice = currentDiscountedPrice || originalPrice;
      let newDiscountAmount = 0;
      let totalDiscountAmount = 0;
      
      // Calculate the new discount amount
      if (discountType === "Percentage") {
        newDiscountAmount = (basePrice * discountValue) / 100;
      } else {
        newDiscountAmount = discountValue;
      }
      
      // Calculate total discount if there's already a discount applied
      if (currentDiscountedPrice) {
        const existingDiscount = originalPrice - currentDiscountedPrice;
        totalDiscountAmount = existingDiscount + newDiscountAmount;
      } else {
        totalDiscountAmount = newDiscountAmount;
      }
      
      // Cap the total discount at 20% of original price
      if (totalDiscountAmount > maximumDiscountForProduct) {
        totalDiscountAmount = maximumDiscountForProduct;
      }
      
      const finalDiscountedPrice = originalPrice - totalDiscountAmount;
      
      // Ensure price doesn't go below 0
      return Math.max(0, Number(finalDiscountedPrice.toFixed(2)));
    };

    // Corrected discount application logic for cart products
    for (const product of cart.products) {
      const productPrice = product.price * product.quantity;
      let discountedPrice = productPrice; // Initialize with original price
      let offersData = [];
      let hasDiscount = false; // Track if any discount was applied
      
      // Apply global offers first
      if (offerApplicableToAllProducts.length > 0) {
        const globalOffer = offerApplicableToAllProducts[offerApplicableToAllProducts.length - 1];
        discountedPrice = calculateDiscountedPrice(
          productPrice,
          globalOffer.type_of_discount,
          globalOffer.discountValue
        );
        hasDiscount = true;
        
        if (globalOffer.type_of_discount === "Percentage") {
          offersData.push(`${globalOffer.discountValue}% off`);
        } else {
          offersData.push(`Flat ₹${globalOffer.discountValue} off`);
        }
      }

      const applyOffer = function (matchedOffers) {
        if (matchedOffers.length > 0) {
          const offer = matchedOffers[matchedOffers.length - 1];
          
          discountedPrice = calculateDiscountedPrice(
            productPrice,
            offer.discountType,
            offer.discountValue,
            hasDiscount ? discountedPrice : null
          );
          hasDiscount = true;
          
          if (offer.discountType === "Percentage") {
            offersData.push(`${offer.discountValue}% off`);
          } else {
            offersData.push(`Flat ₹${offer.discountValue} off`);
          }
        }
      };

      // Apply category-specific offers
      if (discountedCategories.length > 0) {
        const matchedCategories = discountedCategories.filter(
          (category) => category.category === product.productId.usage
        );
        applyOffer(matchedCategories);
      }

      // Apply brand-specific offers
      if (discountedBrands.length > 0) {
        const matchedBrands = discountedBrands.filter(
          (brand) => brand.brandName === product.productId.product_brand
        );
        applyOffer(matchedBrands);
      }

      // Apply product-specific offers
      if (discountedProducts.length > 0) {
        const matchedProducts = discountedProducts.filter(
          (productOffer) =>
            productOffer.productId.toString() === product.productId._id.toString()
        );
        applyOffer(matchedProducts);
      }

      // discountedPrice will remain equal to productPrice if no discounts were applied
      
      appliedOffers.push(offersData);
      discountedPrices.push(discountedPrice);
      discountedValues.push(productPrice - discountedPrice);
      gst.push(Number(((discountedPrice * 18) / 100).toFixed(2)));
    }

    const updateDiscontsToCart = async (
      cart,
      discountedValues,
      discountedPrices
    ) => {
      cart.products.forEach((product, index) => {
        product.discountedPrice = discountedPrices[index];
        product.discountValue = discountedValues[index];
        product.gst = gst[index];
      });

      // Save the cart
      await cart.save();
    };

    updateDiscontsToCart(cart, discountedValues, discountedPrices, gst);

    const totalDiscountedPrice = discountedPrices.reduce(
      (acc, amount) => (acc += amount),
      0
    );

    // Discount Amount for sales report
    const discountDeduction = totalOriginalPrice - totalDiscountedPrice;

    if (req.user) {
      // If the user is authenticated, retrieve user details from the database
      const userId = req.user.userId;
      const user = await userCredentials.findOne({ _id: userId });

      // Get the username from the user details
      const username = user.first_name;

      // Render the cart page with the user's username and available brands
      res.render("user/cartPage", {
        username,
        brands,
        user,
        products,
        cart,
        originalPrices,
        discountedPrices,
        totalOriginalPrice,
        totalDiscountedPrice,
        discountDeduction,
        appliedOffers,
        couponsAvailable,
        productIdsInWishlist
      });
    }
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Failed to fetch brand names for userCartPage:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).render('404', { title: "Route not found"});
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) return res.redirect("/loginPage");
    const productId = req.params.id;
    const product = await productsList.findOne({ _id: productId });
    const productPrice = product.product_price;
    const quantity = 1;

    let cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      // Create a new cart document
      cart = new Cart({
        userId: userId,
        products: [
          {
            productId: productId,
            quantity: quantity,
            price: productPrice, 
          },
        ],
      });
    } else {
      // Check if the product already exists in the cart
      const existingProductIndex = cart.products.findIndex(
        (product) => product.productId.toString() === productId
      );

      if (existingProductIndex > -1) {
        // If the product exists, update the quantity
        cart.products[existingProductIndex].quantity += quantity;
        if (cart.products[existingProductIndex].quantity > 3) {
          return res
            .status(200)
            .json({ message: `You are added maximum number of products` });
        }
      } else {
        // If the product doesn't exist, add it to the cart
        cart.products.push({
          productId: productId,
          quantity: quantity,
          price: productPrice,
        });
      }
    }

    const savedCart = await cart.save();

    if (!savedCart) {
      return res.status(404).json({ message: `Failed to add product to cart` });
    }

    res.status(200).json({ message: `Product added to cart!` });
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Failed to add products to cart:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Failed to add products to cart");
  }
};

export const removeProductFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) return res.redirect("/loginPage");

    const { productId, cartId } = req.body;

    const updatedCart = await Cart.findByIdAndUpdate(
      { _id: cartId },
      { $pull: { products: { _id: productId } } },
      { new: true }
    );

    if (updatedCart) {
      res.status(200).json({ message: `Product removed from cart!` });
    } else {
      res.status(404).json({ message: `Cart Not found!` });
    }
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Failed to removing products from cart:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).render('404', { title: "Route not found"});
  }
};

export const cartQuantityControl = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) return res.redirect("/loginPage");

    const { productId, cartId } = req.query;

    const updatedCart = await Cart.findByIdAndUpdate(
      cartId,
      { $pull: { products: { productId: productId } } },
      { new: true }
    );

    if (updatedCart) {
      res.status(200).json({ message: `Product removed from cart!` });
    } else {
      res.status(404).json({ message: `Cart Not found!` });
    }
  } catch (error) {
    console.error("Failed to removing products from cart:", error);
    res.status(500).send("Failed to remove products from cart");
  }
};

export const applyCoupon = async (req, res) => {
  try {
    // Extract Coupon Code from the body
    const { couponCode } = req.body;

    // Extract used ID from the request
    const userId = req.user.userId;

    // Check if the coupon exists
    const coupon = await Coupon.findOne({ coupon_code: couponCode });
    if (!coupon) {
      return res.json({ success: false, message: "Invalid coupon code" });
    }

    // Retrieve user's cart
    const cart = await Cart.findOne({ userId: userId })
      .populate({
        path: "products.productId", // Specify the path to populate
      })
      .exec();

    if (!cart) {
      return res.json({ success: false, message: "Cart not found" });
    }

    // Extract the cart ID
    const cartId = cart._id;

    // Extract the products inside the cart
    const products = cart.products;

    // Calculate the subtotal from the products
    const totalOriginalPrice = products.reduce(
      (acc, product) => (acc += product.price),
      0
    );

    // Calculate the total discount applied
    const discountDeduction = products.reduce(
      (acc, product) => (acc += product.discountValue),
      0
    );

    // Calculate coupon deduction
    let couponDeduction = 0;
    let maximumDiscount;
    if (coupon.type_of_coupon === "Fixed") {
      couponDeduction = coupon.discountValue;
    } else {
      maximumDiscount = (totalOriginalPrice * 20) / 100;
      couponDeduction = (totalOriginalPrice * coupon.discountValue) / 100;
      if (couponDeduction + discountDeduction > maximumDiscount) {
        if (maximumDiscount - discountDeduction <= 0) {
          couponDeduction = 0;
        } else {
          couponDeduction = maximumDiscount - discountDeduction;
        }
      }
    }

    // Calculate the total gst applicable
    const gst = products.reduce((acc, product) => (acc += Number(product.gst)), 0);

    // Calculate the grand Total
    const totalDiscountedPrice =
      totalOriginalPrice - (discountDeduction + couponDeduction) + gst;

    // Group together the billSummary after applying coupon
    const billSummaryCouponApplied = {
      subtotal: totalOriginalPrice,
      discount: discountDeduction,
      couponDeduction: couponDeduction,
      gst: gst,
      grandTotal: totalDiscountedPrice,
    };

    return res.json({
      success: true,
      totalOriginalPrice,
      discountDeduction,
      couponDeduction,
      gst,
      totalDiscountedPrice,
      cartId,
      billSummaryCouponApplied,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    return res.json({ success: false, message: "Error applying coupon" });
  }
};