import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { brands as brand } from "../../models/brandModel.mjs";
import { products as product } from "../../models/productDetailsModel.mjs";
import { Cart } from "../../models/cartModel.mjs";
import { Discounts } from "../../models/discountModel.mjs";

/**
 * Handles the rendering of the products page with paginated product details.
 *
 * This asynchronous function retrieves a paginated list of products from the database and renders the products page.
 * It supports pagination by using `page` and `limit` query parameters from the request. If these parameters are not provided,
 * default values are used (page 1 and limit 10). The function calculates the total number of pages based on the number of
 * products and the specified limit, and passes this information along with the current page and products to the view for rendering.
 *
 * @param {Object} req - The HTTP request object, which includes query parameters for pagination.
 * @param {Object} res - The HTTP response object, used to render the view with the products and pagination details.
 *
 * @returns {void} This function does not return a value but sends an HTTP response by rendering the view.
 *
 * @throws {Error} Logs an error to the console if there is an issue fetching the product data from the database.
 */

export const productsFilterPage = async (req, res) => {
  // Extract page number and limit from query parameters with default values
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    let products = "";
    let products1 = "";
    let dir = "";
    let category = "";
    let filter = req.query.filter;
    let sort = req.query.sort || "";
    const productId = req.query.productId || "";
    let sortOrder = null;
    let query = req.query.query || "";

    if (filter === "brand") {
      // Determine the sort order based on the query parameter
      const brandId = req.query.id || "";
      if (sort === "highToLow") {
        sortOrder = { product_price: -1 };
      } else if (sort === "lowToHigh") {
        sortOrder = { product_price: 1 };
      } else if (sort === "A-Z") {
        sortOrder = { product_name: 1 }; // Assuming `product_name` is the field for product names
      } else if (sort === "Z-A") {
        sortOrder = { product_name: -1 }; // Reverse alphabetical order
      } else {
        sortOrder = {}; // Default sorting or handle unexpected values
      }

      // Common query with dynamic sorting
      const brands = await brand.find({ _id: brandId }).populate({
        path: "products",
        match: {
          isDeleted: false,
        },
        options: {
          sort: sortOrder,
        },
      });

      // Extract the relevant data from the result
      products = brands[0].products || [];
      dir = brands[0] || {};
      category = brands[0].brand_name || "";
      sort = "";
    } else if (productId) {
      products = await product.find({ _id: productId });
      dir = products[0];
      category = products[0].product_brand;
    } else if (query) {
      let searchCriteria = {
        $or: [
          { product_brand: { $regex: query, $options: "i" } }, // case-insensitive search
          { product_name: { $regex: query, $options: "i" } }, // optionally, also search by product name
        ],
        isDeleted: false,
      };
      products = (await product.find(searchCriteria)) || [];

      if (sort === "highToLow") {
        products = products.sort((a, b) => b.product_price - a.product_price);
        sort = "";
      } else if (sort === "lowToHigh") {
        products = products.sort((a, b) => a.product_price - b.product_price);
        sort = "";
      } else if (sort === "A-Z") {
        products = products.sort((a, b) =>
          a.product_name.charAt(0).localeCompare(b.product_name.charAt(0))
        );
        sort = "";
      } else if (sort === "Z-A") {
        products = products.sort((a, b) =>
          b.product_name.charAt(0).localeCompare(a.product_name.charAt(0))
        );
        sort = "";
      } else {
        // Default case if needed
        sortOrder = {};
      }
    } else {
      const brands = await brand.find({ isBlocked: false }).populate({
        path: "products",
        match: { isDeleted: false },
        options: {
          sort: sortOrder,
        },
      });

      products1 = await product
        .find({ isDeleted: false })
        .skip((page - 1) * limit)
        .limit(limit);

      products = brands.flatMap((brands) => brands.products);
      category = "All";
      if (sort === "highToLow") {
        products = products.sort((a, b) => b.product_price - a.product_price);
        sort = "";
      } else if (sort === "lowToHigh") {
        products = products.sort((a, b) => a.product_price - b.product_price);
        sort = "";
      } else if (sort === "A-Z") {
        products = products.sort((a, b) =>
          a.product_name.charAt(0).localeCompare(b.product_name.charAt(0))
        );
        sort = "";
      } else if (sort === "Z-A") {
        products = products.sort((a, b) =>
          b.product_name.charAt(0).localeCompare(a.product_name.charAt(0))
        );
        sort = "";
      } else {
        // Default case if needed
        sortOrder = {};
      }
    }

    // Discount variables
    const discountedPrices = [];
    const appliedOffers = [];
    const discountedCategories = [];
    const discountedBrands = [];
    const discountedProducts = [];

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false });

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

    for (const product of products) {
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

      appliedOffers.push(offersData);
      discountedPrices.push(discountedPrice);
    }

    // Calculate total number of products
    const totalProducts = products.length;

    if (filter !== "brand" && !productId && !query) {
      products = products1;
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / limit);

    // Prepare pagination data
    const paginationData = {
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    // Render the filter page view with additional pagination data
    if (req.user) {
      const userId = req.user.userId;

      // Fetch the us  er details from the database using the user ID
      const user = await userCredentials.find({ _id: userId });

      // Extract the username from the user details
      const username = user[0].first_name;

      const cart = await Cart.findOne({ userId: userId });
      let isAlredayInCart = false;

      if (cart) {
        for (let i = 0; i < cart.products.length; i++) {
          if (cart.products[i].productId.toString() === productId) {
            isAlredayInCart = true;
          }
        }
      }

      // Render the 'filterPage' view, passing username, brands, and products
      res.render("user/filterPage", {
        username,
        brands,
        products,
        category,
        dir,
        filter,
        query,
        discount,
        isAlredayInCart,
        cart,
        offerApplicableToAllProducts,
        offerApplicableForCategory,
        discountedPrices,
        appliedOffers,
        paginationData,
      });
    } else {
      // Render the 'filterPage' view, passing username, brands, and products
      res.render("user/filterPage", {
        username: "Login",
        brands,
        products,
        category,
        dir,
        filter,
        query,
        discount,
        offerApplicableToAllProducts,
        offerApplicableForCategory,
        discountedPrices,
        appliedOffers,
        isAlredayInCart: false,
        paginationData,
      });
    }
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Failed to fetch data for user product filter page:", error);

    // Send a 500 Internal Server Error response if an error occurs
    res.status(404).render('404', { title: "Route not found"});
  }
};
