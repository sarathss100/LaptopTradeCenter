import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { products as productsList } from "../../models/productDetailsModel.mjs";
import { brands as brand } from "../../models/brandModel.mjs";
import { Cart } from "../../models/cartModel.mjs";
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

export const userCartPage = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Retrieve product brand details from the database
    const products = await productsList.find({});

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false });

    const cart = await Cart.findOne({ userId: userId })
      .populate({
        path: "products.productId", // Specify the path to populate
        populate: {
          path: "discount",
          model: "Discounts",
        }, // Populate the discount field within each product
      })
      .exec();

    // Extract coupons from the coupon details
    const coupons = await Coupon.find({});

    // console.log(coupons);

    const couponsForAllProducts = coupons.filter(
      (coupon) => coupon.applicableToAllBrands === true
    );
    const couponsForBrands = coupons.filter(
      (coupon) => coupon.brandSpecific.length > 0
    );
    const couponsForProducts = coupons.filter(
      (coupon) => coupon.productSpecific.length > 0
    );

    // Coupon Code for all products
    const couponCodesForAllProducts = couponsForAllProducts.map(
      (coupon) => coupon.coupon_code
    );

    const convertArray = function (array) {
      return array.map((element) => element.toString());
    };

    const couponApplicableBrandIds = couponsForBrands.map((coupon) =>
      convertArray(coupon.brandSpecific)
    );

    let originalPrice = [];
    let discountedPrice = [];
    let savings = 0;

    for (let i = 0; i < cart.products.length; i++) {
      originalPrice.push(cart.products[i].price * cart.products[i].quantity);
      for (let j = 0; j < cart.products[i].productId.discount.length; j++) {
        const discountPercentage =
          cart.products[i].productId.discount[j].discount_percentage;
        const discountAmount = (originalPrice[i] * discountPercentage) / 100;
        savings += discountAmount;
        discountedPrice.push(Math.round(originalPrice[i] - discountAmount));
      }
    }
    const totalOriginalPrice = originalPrice.reduce(
      (acc, amount) => (acc = acc + amount),
      0
    );
    const totalDiscountedPrice = discountedPrice.reduce(
      (acc, amount) => (acc += amount),
      0
    );

    savings = Math.floor(savings);

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
        originalPrice,
        discountedPrice,
        totalOriginalPrice,
        totalDiscountedPrice,
        savings,
      });
    }
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Failed to fetch brand names for userCartPage:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Failed to render the cart page");
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) return res.redirect("/user/loginPage");
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

    if (!userId) return res.redirect("/user/loginPage");

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
    res.status(500).send("Failed to remove products from cart");
  }
};

export const cartQuantityControl = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) return res.redirect("/user/loginPage");

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
    // Log the error message to the console for debugging purposes
    console.error("Failed to removing products from cart:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Failed to remove products from cart");
  }
};
