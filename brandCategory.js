import { products } from './models/productDetailsModel.mjs';  // Assuming Product model is exported
import { brands } from './models/brandModel.mjs';  // Assuming BrandCategory model is exported

async function populateBrandCategories() {
  try {
    // Fetch all unique brand names from the Product collection
    const uniqueBrands = await products.distinct( 'product_brand' );


    for (const brandName of uniqueBrands) {
      // Find products associated with this brand
      const product = await products.find({ product_brand: brandName });

      // Extract product IDs
      const productIds = product.map(product => product._id);

      // Create a new BrandCategory document
      const brands = new brands({
        brand_name: brandName,
        products: productIds,
      });

      // Save the BrandCategory document
      await brands.save();
    }

    console.log('Brand categories populated successfully!');
  } catch (err) {
    console.error('Error populating brand categories:', err);
  }
}

populateBrandCategories();
