import { products } from '../models/productDetailsModel.mjs';

export const searchProduct = async ( req, res ) => {
    const { query } = req.query;
    
    try {
        const searchCriteria = {
            $or: [
                { product_brand: { $regex: query, $options: 'i' } },
            ],
            isDeleted: false
        };

        const results = await products.find(searchCriteria);

        
        res.json(results);
    } catch ( error ) {
        res.status(500).json({ message: 'Error searching for products', error})
    }
}
 