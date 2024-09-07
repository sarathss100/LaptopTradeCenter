import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { brands as brand } from "../../models/brandModel.mjs";
import { WishList } from "../../models/wishListModel.mjs";
import { products } from "../../models/productDetailsModel.mjs";
import { Cart } from "../../models/cartModel.mjs";

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
    const userId = req.user.userId;
    if (!userId) {
      return res.redirect("/user/loginPage");
    }

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false });

    const productId = req.params.id;
    const dir = await brand.findOne({ products: productId }).exec();

    const wishList = await WishList.findOne({ userId: userId }).populate(
      "wishlist"
    );

    const cart = await Cart.findOne({ userId: userId });
    let isAlredayInCart = false;

    for (let i = 0; i < cart.products.length; i++) {
      if (cart.products[i].productId.toString() === productId) {
        isAlredayInCart = true;
      }
    }

    const product = await products.findOne({ _id: productId });

    const populatedBrands = await brand
      .find({ isBlocked: false })
      .populate({
        path: "products",
        populate: {
          path: "discount",
          model: "Discounts",
        },
      })
      .exec();

    const discountPercentage =
      populatedBrands[0].products[0].discount[0].discount_percentage;
    const discountAmount = (product.product_price * discountPercentage) / 100;
    const discountedPrice = Math.round(product.product_price - discountAmount);

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
        discountedPrice,
        discountPercentage,
        dir,
        isAlredayInCart,
        cart,
      });
    } else {
      // If the user is not authenticated, render the product detail page with 'Login' as the username
      res.render("user/productDetailPage", {
        username: "Login",
        brands,
        user,
        product,
        discountedPrice,
        discountPercentage,
        dir,
        isAlredayInCart,
        cart,
      });
    }
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Failed to fetch brand names for wish list page:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Failed to render the wish list page");
  }
};
