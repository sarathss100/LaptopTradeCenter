import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { brands as brand } from "../../models/brandModel.mjs";
import { WishList } from "../../models/wishListModel.mjs";
import { products } from "../../models/productDetailsModel.mjs";
import { Cart } from "../../models/cartModel.mjs";
import { Discounts } from "../../models/discountModel.mjs";

export const productDetailPage = async (req, res) => {
  try {
    const userId = req.user.userId;

    const productId = req.params.id;

    const brands = await brand.find({ isBlocked: false });
    const dir = await brand.findOne({ products: productId }).exec();
    const wishList = await WishList.findOne({ userId: userId }).populate(
      "wishlist"
    );

    // Extract the cart details from the data base
    const cart = await Cart.findOne({ userId: userId });
    let isAlredayInCart = false;

    if (cart) {
      // Check wheter the product already added inside the cart
      for (let i = 0; i < cart.products.length; i++) {
        if (cart.products[i].productId.toString() === productId) {
          isAlredayInCart = true;
          break;
        }
      }
    }

    // Extract the product details using product ID
    const product = await products.findOne({ _id: productId });

    const filterForRelatedProducts = product.usage;

    const relatedProducts = await products
      .find({
        usage: filterForRelatedProducts,
        _id: { $ne: productId },
        isDeleted: { $ne: true },
      })
      .limit(4);

    // Discount variables to store the specific discounts
    const discountedPrices = [];
    const appliedOffers = [];
    const discountedCategories = [];
    const discountedBrands = [];
    const discountedProducts = [];

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

    if (product) {
      const productPrice = product.product_price;
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
          (category) => category.category === product.usage
        );
        applyOffer(matchedCategories);
      }

      // Apply brand-specific offers
      if (discountedBrands.length > 0) {
        const matchedBrands = discountedBrands.filter(
          (brand) => brand.brandName === product.product_brand
        );
        applyOffer(matchedBrands);
      }

      // Apply product-specific offers
      if (discountedProducts.length > 0) {
        const matchedProducts = discountedProducts.filter(
          (productOffer) => productOffer.productId.toString() === product._id.toString()
        );
        applyOffer(matchedProducts);
      }

      // discountedPrice will remain equal to productPrice if no discounts were applied
      
      appliedOffers.push(...offersData);
      discountedPrices.push(discountedPrice);
    }

    if (req.user) {
      // If the user is authenticated, retrieve user details from the database
      const userId = req.user.userId;
      const user = await userCredentials.findOne({ _id: userId });

      // Get the username from the user details
      const username = user.first_name;

      res.render("user/productDetailPage", {
        username,
        brands,
        user,
        product,
        discountedPrices,
        appliedOffers,
        dir,
        isAlredayInCart,
        cart,
        relatedProducts,
      });
    } else {
      res.render("user/productDetailPage", {
        username: "Login",
        brands,
        user,
        product,
        discountedPrices,
        appliedOffers,
        dir,
        isAlredayInCart,
        cart,
        relatedProducts,
      });
    }
  } catch (error) {
    console.error(
      "Failed to fetch brand names for product details page:",
      error
    );
    res.status(404).render('404', { title: "Route not found"});
  }
};