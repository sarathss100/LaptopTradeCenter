import { products } from "../models/productDetailsModel.mjs";

export const searchProduct = async (req, res) => {
  const { query } = req.query;

  try {
    let searchCriteria = { isDeleted: false };

    // If the query exists, apply the search filter
    if (query && query.trim()) {
      searchCriteria = {
        $or: [
          { product_brand: { $regex: query, $options: "i" } }, // case-insensitive search
          { product_name: { $regex: query, $options: "i" } }, // optionally, also search by product name
        ],
        isDeleted: false,
      };
    }

    const results = await products.find(searchCriteria);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Error searching for products", error });
  }
};
