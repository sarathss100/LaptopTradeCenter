import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { products as productsList } from "../../models/productDetailsModel.mjs";
import { brands as brand } from "../../models/brandModel.mjs";

// 'bcrypt' library is used for hashing and compairing passwords securely
import bcrypt from "bcrypt";

// Define the number of salt rounds for bcrypt hashing
const saltRounds = 10;

/**
 * Renders the password reset page with any error messages from the session.
 *
 * This asynchronous function handles rendering the password reset page for users. It retrieves any error messages
 * related to password reset from the session and clears them after retrieval. If an error occurs while rendering the page,
 * it logs the error and sends a 500 Internal Server Error response.
 *
 * @param {Object} req - The HTTP request object containing details of the HTTP request.
 * @param {Object} res - The HTTP response object used to send responses to the client.
 *
 * @returns {Promise<void>} This function does not return a value but renders the password reset page view or sends an error message.
 *
 * @throws {Error} Logs an error to the console if there is an issue rendering the password reset page.
 */
export const resetPasswordPage = async (req, res) => {
  try {
    // Fetch the products for the current page with pagination
    let products = await productsList.find({ isDeleted: false });

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false });

    const userId = req.user.userId;

    // Fetch the user details from the database using the user ID
    const user = await userCredentials.find({ _id: userId });

    // Extract the username from the user details
    const username = user[0].first_name;

    // Retrieve any stored error messages related to password mismatch from the session
    // Default to an empty string if no errors are present
    const userPasswordDoNotMatchError =
      req.session.userPasswordDoNotMatchError || "";

    // Clear error messages related to password mismatch from the session
    req.session.userPasswordDoNotMatchError = "";

    // Render the password reset page view with the retrieved error messages
    res.render("user/userChangePassword", {
      userPasswordDoNotMatchError,
      user,
      username,
      brands,
      products,
    });
  } catch (error) {
    // Log any errors that occur during the rendering process
    console.error("Failed to render the reset password page:", error);

    // Send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Failed to render the password reset page");
  }
};

/**
 * Handles the password reset form submission.
 *
 * @param {Object} req - The request object containing HTTP request details and form data.
 * @param {Object} res - The response object used to send HTTP responses.
 *
 * Validates the provided password and new password, hashes the new password, and updates it in the database.
 */

export const resetPasswordForm = async (req, res) => {
  try {
    const { current_password, password } = req.body;
    const userId = req.user.userId;

    const user = await userCredentials.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      current_password,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid current password",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedNewPassword = await bcrypt.hash(password, salt);

    // Update the user's password
    const updateResult = await userCredentials.updateOne(
      { _id: userId },
      { $set: { password: hashedNewPassword } }
    );

    if (updateResult.modifiedCount === 1) {
      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to change the password",
      });
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};
