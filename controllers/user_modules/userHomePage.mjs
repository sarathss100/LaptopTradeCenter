import { productDetailsModel, userCredentialsModel } from '../../models/mongodb.mjs';

/**
 * Renders the user's home page.
 * 
 * @param {Object} req - The request object containing HTTP request details.
 * @param {Object} res - The response object used to send HTTP responses.
 */
const userHomePage = async (req, res) => {

    try {
        const products = await productDetailsModel.find({});
        const brands = [...new Set(products.map(product => product.product_brand))];

        if (req.user) {
            const userId = req.user.userId;
            
            const user = await userCredentialsModel.findOne({ '_id' : userId });
            
            const username = user.first_name || user ;
            // If the user is authenticated, render the user home page
            res.render('user/homePage', { username, brands, products });
        } else {
            res.render('user/homePage', { 'username': 'Login', brands, products });
        }
    } catch (error) {
        console.log(`Failed to fetch data for user HomePage`, error);
        res.status(500).send('Error fetching user home page data');
    }
};

export default userHomePage;
