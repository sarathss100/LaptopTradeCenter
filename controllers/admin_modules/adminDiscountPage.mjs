import { products } from '../../models/productDetailsModel.mjs';
import { Discounts } from '../../models/discountModel.mjs';

/**
 * Renders the page to add a new discount.
 *
 * This function retrieves all available discounts and renders the discount page. 
 * The page allows admins to add new discounts or manage existing ones.
 * If an error occurs during rendering, it logs the error and sends a 500 status code.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * 
 * @returns {void} This function does not return a value but renders the add discount page or sends an error response.
 */
export const adminAddDiscountPage = async (req, res) => {
    try {
        // Fetch all discounts from the database
        const discount = await Discounts.find({});
        const purpose = 'new'; // Purpose determines the form mode (add new discount)
        
        // Render the discount page with the fetched discounts and purpose
        res.render('admin/adminDiscountPage', { discount, purpose });
    } catch (error) {
        // Log any errors that occur and send a 500 error response
        console.error('Failed to render the add discount page:', error);
        res.status(500).send('Failed to render the add discount page');
    }
};

/**
 * Handles form submission for adding a new discount.
 * 
 * This function processes the form data for a new discount, saves it to the database, 
 * and then updates all products to include the newly created discount.
 * 
 * @param {Object} req - The HTTP request object containing form data.
 * @param {Object} res - The HTTP response object used to redirect the client.
 * 
 * @returns {void} This function redirects the client to the discount page or sends an error response.
 */
export const addDiscountForm = async (req, res) => {
    // Create a new discount instance from the form data
    const newDiscount = new Discounts({
        discount_percentage: req.body.discount_percentage,
        discount_expiration: req.body.discount_expiration
    });

    try {
        // Save the new discount to the database
        const savedDiscount = await newDiscount.save();

        // Update all products to include the new discount
        await products.updateMany({}, { $push: { discount: savedDiscount._id } });

        // Redirect to the discount page after successful operation
        res.redirect('/admin/addDiscountPage');
    } catch (error) {
        // Log any errors that occur and send a 500 error response
        console.error('Failed to add the discount', error);
        res.status(500).send('Failed to add the discount');
    }
};

/**
 * Renders the page to edit an existing discount.
 * 
 * This function fetches the discount data by ID and renders the discount page in edit mode.
 * The admin can modify the discount details and submit the form to save changes.
 * 
 * @param {Object} req - The HTTP request object containing the discount ID.
 * @param {Object} res - The HTTP response object used to render the discount page.
 * 
 * @returns {void} This function renders the discount page in edit mode or sends an error response.
 */
export const editDiscountPage = async (req, res) => {
    try {
        const discountId = req.params.id;
        const purpose = 'edit'; // Purpose determines the form mode (edit discount)
        
        // Fetch the discount by ID from the database
        const discount = await Discounts.find({ '_id': discountId });

        // Render the discount page with the fetched discount data and purpose
        res.render('admin/adminDiscountPage', { discount, purpose });
    } catch (error) {
        // Log any errors that occur and send a 500 error response
        console.error('Failed to render the edit discount page:', error);
        res.status(500).send('Failed to render the edit discount page');
    }
};

/**
 * Handles form submission for editing an existing discount.
 * 
 * This function processes the updated discount data and applies changes to the database.
 * If the update is successful, it redirects the client to the discount page.
 * 
 * @param {Object} req - The HTTP request object containing the discount ID and updated form data.
 * @param {Object} res - The HTTP response object used to redirect the client.
 * 
 * @returns {void} This function redirects the client to the discount page or sends an error response.
 */
export const editDiscountForm = async (req, res) => {
    const discountId = req.params.id;

    // Prepare the updated discount data from the form submission
    const newDiscount = {
        discount_percentage: req.body.discount_percentage,
        discount_expiration: req.body.discount_expiration
    };

    try {
        // Update the discount by ID with the new data
        const updateDiscount = await Discounts.findByIdAndUpdate(
            discountId,
            newDiscount,
            { new: true } // Return the updated document
        );

        // If no discount is found, send a 404 response
        if (!updateDiscount) {
            return res.status(404).send('Discount not found');
        }

        // Redirect to the discount page after successful operation
        res.redirect('/admin/addDiscountPage');
    } catch (error) {
        // Log any errors that occur and send a 500 error response
        console.error('Failed to update the discount', error);
        res.status(500).send('Failed to update the discount');
    }
};

/**
 * Handles the deletion of a discount.
 * 
 * This function removes the discount by ID from the database and updates all products to remove references to the deleted discount.
 * After the deletion, it redirects the client to the discount page.
 * 
 * @param {Object} req - The HTTP request object containing the discount ID.
 * @param {Object} res - The HTTP response object used to redirect the client.
 * 
 * @returns {void} This function redirects the client to the discount page or sends an error response.
 */
export const deleteDiscount = async (req, res) => {
    try {
        const discountId = req.params.id;

        // Remove the discount reference from all products
        await products.updateMany({ discount: discountId }, { $pull: { discount: discountId } });

        // Delete the discount from the database by ID
        const deleteDiscount = await Discounts.findByIdAndDelete(discountId);

        // If no discount is found, send a 404 response
        if (!deleteDiscount) {
            return res.status(404).send('Discount not found');
        }

        // Redirect to the discount page after successful operation
        res.redirect('/admin/addDiscountPage');
    } catch (error) {
        // Log any errors that occur and send a 500 error response
        console.error('Failed to delete the discount', error);
        res.status(500).send('Failed to delete the discount');
    }
};