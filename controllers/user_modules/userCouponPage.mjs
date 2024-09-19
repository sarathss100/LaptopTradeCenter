import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { products as productsList } from "../../models/productDetailsModel.mjs";
import { brands as brand } from "../../models/brandModel.mjs";
import { Wallet } from "../../models/walletModel.mjs";
import mongoose, { Mongoose } from "mongoose";

/**
 * Renders the user's cart page.
 * This function handles the request to display the user's shopping cart and brand information.
 *
 * @param {Object} req - The request object containing HTTP request details.
 * @param {Object} res - The response object used to send HTTP responses.
 *
 * @returns {Promise<void>} - A promise that resolves to undefined when the rendering is complete.
 */

const userCouponPage = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to the first page
  const limit = parseInt(req.query.limit) || 10; // Default to 5 items per page
  const skip = (page - 1) * limit;
  try {
    // Retrieve product brand details from the database
    const products = await productsList.find({}, { _id: 0, product_brand: 1 });

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false });

    if (req.user) {
      // If the user is authenticated, retrieve user details from the database
      let userId = req.user.userId;
      const user = await userCredentials.findOne({ _id: userId });

      userId = new mongoose.Types.ObjectId(userId);

      // Retrive wallet details from the database
      const wallet = await Wallet.find({ userId: userId });

      const test = await Wallet.aggregate([
        { $match: { userId: userId } },
        {
          $project: {
            _id: 0, // Exclude the _id field from the result
            transactionHistory: {
              $slice: ["$transactionHistory", skip, limit], // Slice the array for pagination
            },
            totalTransactions: { $size: "$transactionHistory" },
          },
        },
      ]);

      const transactionHistory = test[0].transactionHistory;

      // Get total count of transactions
      const totalTransactions = test[0].totalTransactions.length;

      // Calculating total pages
      const totalPages = Math.ceil(totalTransactions / limit);

      // Get the username from the user details
      const username = user.first_name;

      // Render the cart page with the user's username and available brands
      res.render("user/userCouponsPage", {
        username,
        brands,
        user,
        products,
        wallet,
        transactionHistory,
        currentPage: page,
        totalPages,
        limit,
      });
    } else {
      // If the user is not authenticated, render the cart page with 'Login' as the username
      res.render("user/userCouponsPage", {
        username: "Login",
        brands,
        user,
        products,
      });
    }
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Failed to fetch brand names for userCartPage:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Failed to render the cart page");
  }
};

// Export the function as the default export, allowing it to be imported and used in other parts of the application
export default userCouponPage;
