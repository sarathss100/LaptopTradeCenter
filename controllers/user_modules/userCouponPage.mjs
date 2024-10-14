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
  const limit = parseInt(req.query.limit) || 7; // Default to 7 items per page
  const skip = (page - 1) * limit;
  try {
    // Retrieve product brand details from the database for navigation section
    const products = await productsList.find({}, { _id: 0, product_brand: 1 });

    // Extract unique brand names from the product details for navigation section
    const brands = await brand.find({ isBlocked: false });

    if (req.user) {
      // If the user is authenticated, retrieve user details from the database
      let userId = req.user.userId;

      // Extract user details from the mongoDB
      const user = await userCredentials.findOne({ _id: userId });

      // Convert the userID string to object ID
      userId = new mongoose.Types.ObjectId(userId);

      // Retrive wallet details from the database
      let wallet = await Wallet.findOne({ userId: userId });

      if (!wallet) {
        wallet = new Wallet({ userId: userId });
        await wallet.save();
      }

      if (wallet && wallet.transactionHistory) {
        // Sort transactionHistory by date in descending order
        wallet.transactionHistory.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        // Pagination the sorted transaction history
        const paginatedTransactions = wallet.transactionHistory.slice(
          skip,
          skip + limit
        );

        // Pagination logic
        const totalPages = Math.ceil(wallet.transactionHistory.length / limit);
        const paginationData = {
          currentPage: page,
          totalPages: totalPages,
          hasPrevPage: page > 1,
          hasNextPage: page < totalPages,
        };

        // Get the username from the user details
        const username = user.first_name;

        // Render the cart page with the user's username and available brands
        res.render("user/userCouponsPage", {
          username,
          brands,
          user,
          products,
          wallet,
          transactionHistory: paginatedTransactions,
          paginationData: paginationData,
          limit,
        });
      }
    }
  } catch (error) {
    // Log the error message to the console for debugging purposes
    console.error("Failed to fetch brand names for userCartPage:", error);

    // Optionally, send a 500 Internal Server Error response if an error occurs
    res.status(500).render('404', { title: "Route not found"});
  }
};

// Export the function as the default export, allowing it to be imported and used in other parts of the application
export default userCouponPage;
