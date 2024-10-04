import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { brands as brand } from "../../models/brandModel.mjs";
import { WishList } from "../../models/wishListModel.mjs";
import { products } from "../../models/productDetailsModel.mjs";
import { Cart } from "../../models/cartModel.mjs";
import { Discounts } from "../../models/discountModel.mjs";

/**
 * Renders the user's product detail page.
 * This function handles the request to display the user's product detail information.
 *
 * @param {Object} req - The request object containing HTTP request details.
 * @param {Object} res - The response object used to send HTTP responses.
 *
 * @returns {Promise<void>} - A promise that resolves to undefined when the rendering is complete.
 */

export const productDetailPage = async (req, res) => {
  try {
    // Extracting user ID from the request
    const userId = req.user.userId;

    // Extractomg product ID from the params
    const productId = req.params.id;

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false });

    // Find the brand the related to the product using product ID for breadcrumps
    const dir = await brand.findOne({ products: productId }).exec();

    // Extract the wishlist details from the data base
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

    if (product) {
      const productPrice = product.product_price;
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
          offersData.push(` ${discountValue}% off`);
        } else {
          offersData.push(` Flat ₹${discountValue} off`);
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
            ` ${isMatched[isMatched.length - 1].discountValue}% off`
          );
        } else {
          offersData.push(
            ` Flat ₹${isMatched[isMatched.length - 1].discountValue} off`
          );
        }
      };

      if (discountedCategories.length > 0) {
        const isMatched = discountedCategories.filter(
          (category) => category.category === product.usage
        );

        if (isMatched.length > 0) {
          applyOffer(isMatched);
        }
      }

      if (discountedBrands.length > 0) {
        const isMatched = discountedBrands.filter(
          (brand) => brand.brandName === product.product_brand
        );

        if (isMatched.length > 0) {
          applyOffer(isMatched);
        }
      }

      if (discountedProducts.length > 0) {
        const isMatched = discountedProducts.filter(
          (products) => products.productId.toString() === product._id.toString()
        );

        if (isMatched.length > 0) {
          applyOffer(isMatched);
        }
      }

      appliedOffers.push(...offersData);
      discountedPrices.push(discountedPrice);
    }

    if (req.user) {
      // If the user is authenticated, retrieve user details from the database
      const userId = req.user.userId;
      const user = await userCredentials.findOne({ _id: userId });

      // Get the username from the user details
      const username = user.first_name;

      // Render the product detail page with the user's username and available brands
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
      // If the user is not authenticated, render the product detail page with 'Login' as the username
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
    // Log the error message to the console for debugging purposes
    console.error(
      "Failed to fetch brand names for product details page:",
      error
    );

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Failed to render the product details page");
  }
};
