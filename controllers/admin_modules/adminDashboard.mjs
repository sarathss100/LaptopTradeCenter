import { brands as brand } from "../../models/brandModel.mjs";
import { Order } from "../../models/orderModel.mjs";
import { userCredentials } from "../../models/userCredentialsModel.mjs";
import { products as productsList } from "../../models/productDetailsModel.mjs";


const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);

// Get yesterday's date
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

// Set start of yesterday
const previouStartOfDay = new Date(yesterday);
previouStartOfDay.setHours(0, 0, 0, 0);

// Set end of yesterday
const previouEndOfDay = new Date(yesterday);
previouEndOfDay.setHours(23, 59, 59, 999);

const today = new Date();

// Get the start of the week (assuming the week starts on Monday)
const startOfWeek = new Date(today);
const dayOfWeek = startOfWeek.getDay(); // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calculate how many days to subtract to get to Monday
startOfWeek.setDate(startOfWeek.getDate() + diff);
startOfWeek.setHours(0, 0, 0, 0); // Set to 00:00:00.000

// Get the end of the week (assuming the week ends on Sunday)
const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(endOfWeek.getDate() + 6); // Add 6 days to get to Sunday
endOfWeek.setHours(23, 59, 59, 999); // Set to 23:59:59.999

// Set the start of the month
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the current month
startOfMonth.setHours(0, 0, 0, 0); // Set to 00:00:00.000

// Set the end of the month
const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the current month
endOfMonth.setHours(23, 59, 59, 999); // Set to 23:59:59.999

// Set the start of the year
const startOfYear = new Date(today.getFullYear(), 0, 1); // January 1st of the current year
startOfYear.setHours(0, 0, 0, 0); // Set to 00:00:00.000

// Set the end of the year
const endOfYear = new Date(today.getFullYear(), 11, 31); // December 31st of the current year
endOfYear.setHours(23, 59, 59, 999); // Set to 23:59:59.999

// for calculating the total sales amount after deductions
const totalSalesAmountCalculator = function (totalOrders) {
  let totalSalesAmount = 0;
  for (let order of totalOrders) {
    if (order.products.length >= 1) {
      for (let product of order.products) {
        totalSalesAmount +=
          product.discountedPrice +
          product.gst -
          order.couponDeduction / order.products.length;
      }
    }
  }
  return totalSalesAmount;
};

// For calculating the total valid orders
const totalOrderCounter = function (totalOrders) {
  let totalCount = 0;
  for (let order of totalOrders) {
    if (order.products.length >= 1) {
      totalCount++;
    }
  }
  return totalCount;
};

// for calculating the total discount deduction amount
const totalDiscountDeductionAmountCalculator = function (totalOrders) {
  let totalDiscountedAmount = 0;
  for (let order of totalOrders) {
    if (order.products.length >= 1) {
      for (let product of order.products) {
        totalDiscountedAmount += product.discountValue * product.quantity;
      }
    }
  }
  return totalDiscountedAmount;
};

// for calculating the total coupon deduction amount
const totalCouponDeductionAmountCalculator = function (totalOrders) {
  let totalDiscountedAmount = 0;
  for (let order of totalOrders) {
    if (order.products.length >= 1) {
      totalDiscountedAmount += order.couponDeduction;
    }
  }
  return totalDiscountedAmount;
};

const getOrderDetails = async function (start, end) {
  // extract order details
  const orderDetails = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lt: end,
        },
      },
    },
    {
      $project: {
        user: 1,
        totalAmount: 1,
        discountDeduction: 1,
        couponDeduction: 1,
        paymentMode: 1,
        paymentStatus: 1,
        orderStatus: 1,
        shippingAddress: 1,
        createdAt: 1,
        products: {
          $filter: {
            input: "$products",
            as: "product",
            cond: { $ne: ["$$product.orderStatus", "Cancelled"] },
          },
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $lookup: {
        from: "products", // Collection name in the database
        localField: "products.product", // Refers to product IDs in the Order schema
        foreignField: "_id", // Refers to the _id field in the products collection
        as: "productDetails", // The new array field that will contain the populated product details
      },
    },
    {
      $addFields: {
        products: {
          $map: {
            input: "$products", // The filtered products array
            as: "product",
            in: {
              $mergeObjects: [
                "$$product", // The original product object inside the order
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "detail",
                        cond: { $eq: ["$$detail._id", "$$product.product"] },
                      },
                    },
                    0,
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        productDetails: 0, // Optionally hide the raw productDetails array as it has been merged into products
      },
    },
  ])
  return orderDetails;
}

const groupDataByDate = function (orderDetails) {
  const groupedData = {};
  
  orderDetails.forEach((order) => {
    const date = order.createdAt.toISOString().split('T')[0];  // Extract date in YYYY-MM-DD format

    if (!groupedData[date]) {
      groupedData[date] = { sales: 0, profit: 0 };
    }

    // Calculate the total sales for the day
    order.products.forEach((product) => {
      groupedData[date].sales += product.discountedPrice + product.gst - order.couponDeduction / order.products.length;
    });

    // Count valid orders
    if (order.products.length > 0) {
      groupedData[date].profit = Number((groupedData[date].sales * 10 / 100).toFixed());
    }
  });

  return groupedData;
};

const prepareChartData = function (groupedData) {
  const categories = [];
  const sales = [];
  const profits = [];

  // Sort the dates and populate chart data arrays
  Object.keys(groupedData).sort().forEach((date) => {
    categories.push(date);
    sales.push(groupedData[date].sales);
    profits.push(groupedData[date].profit);
  });

  return { categories, sales, profits };
};

/**
 * Handles rendering the admin dashboard or redirecting to the login page based on the user's authentication status.
 *
 * This function checks the presence of an `admin` object in the session to determine if the user is authenticated.
 * - If the `admin` object is present, it means the user is authenticated and the function renders the admin dashboard page.
 * - If the `admin` object is not present, it means the user is not authenticated, and the function redirects them to the login page.
 *
 * @param {Object} req - The HTTP request object containing HTTP request details, including session data.
 * @param {Object} res - The HTTP response object used to send HTTP responses, including rendering views or redirection.
 *
 * @returns {void} This function does not return a value but either renders the admin dashboard view or sends an error message.
 *
 * @throws {Error} Logs an error to the console if there is an issue rendering the admin dashboard page.
 */
export const adminDashBoard = async (req, res) => {
  try {
    // Extract admin user details
    const admin = req.user;

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false }).populate("products");

    // Get dailyOrder details
    const dailyOrders = await getOrderDetails(startOfDay, endOfDay);
    // Get previous day order details
    const previousDayOrders = await getOrderDetails(previouStartOfDay, previouEndOfDay);

    // Total Daily Sales TAB data
    // Calculate daily sales from daily Orders
    const dailyTotalRevenue = totalSalesAmountCalculator(dailyOrders);
    // Calculate previous day sales from previous day order details
    const previousDayRevenue = totalSalesAmountCalculator(previousDayOrders);
    // Calculate the the change
    const dailyRevenueChange = dailyTotalRevenue - previousDayRevenue;
    // Converting to percentage
    const dailyPercentageChange = dailyRevenueChange * 100 / previousDayRevenue;

    // Total Daily Profit TAB data
    // Calculate daily revenue from the dailyTotalRevenue
    const dailyProfit = dailyTotalRevenue * 10 / 100;
    const previousDayProfit = previousDayRevenue * 10 / 100;
    // Calculate the the change
    const profitChange = dailyProfit - previousDayProfit;
    // Converting to percentage
    const profitPercentageChange = profitChange * 100 / previousDayRevenue;
    
    // Total Daily Orders
    const dailyOrdersCount = dailyOrders.filter((order) => order.products.length ).length;
    const previousDayOrdersCount = previousDayOrders.filter((order) => order.products.length ).length;
    const orderChange = dailyOrdersCount - previousDayOrdersCount;
    const orderPercentage = orderChange * 100 / previousDayOrdersCount;

    // Get the total count of customers that are not marked as deleted
    const customerCount = await userCredentials.countDocuments({ isDeleted: false });

    // Get the weekly order details
    const weeklyOrders = await getOrderDetails(startOfWeek, endOfWeek);

    // Get the grouped data 
    const weeklyGrouedData = groupDataByDate(weeklyOrders);
    const weeklyChartData = prepareChartData(weeklyGrouedData);

    // Get the weekly total sales
    const totalWeeklySales = totalSalesAmountCalculator(weeklyOrders);

    //  Get the yearly order Details
    const yearlyOrders = await getOrderDetails(startOfYear, endOfYear);

    const totalOrderesInThisYear = yearlyOrders.filter((order) => order.products.length);
    const totalproductsInThisYear = totalOrderesInThisYear.map((order) => order.products);
    const categoryCount = {};

    for (const productArr of totalproductsInThisYear) {
      for (const product of productArr) {
        if (!categoryCount[product.usage]) {
        categoryCount[product.usage] = 1;
      } else {
        categoryCount[product.usage] += 1;
      }
      }
    }

    const categories = Object.keys(categoryCount);
    const categoryValues = Object.values(categoryCount);
    const totalCategoryCount = categoryValues.reduce((acc, value) => acc += value, 0);
    const categoryPercentages = [];

    for (const value of categoryValues) {
      categoryPercentages.push(value * 100 / totalCategoryCount);
    }

    const productCount = {};
    for (const productArr of totalproductsInThisYear) {
      for (const product of productArr) {
        if (!productCount[product._id]) {
        productCount[product._id] = 1;
      } else {
        productCount[product._id] += 1;
      }
      }
    }

    // Sort the object by key in descending order
   const sortedData = Object.entries(productCount)
  .sort(([, a], [, b]) => b - a) // Sort by values in descending order
  .reduce((acc, [key, value]) => {
    acc[key] = value; // Rebuild the object with sorted values
    return acc;
  }, {});

   const productId = Object.keys(sortedData);
    
    const MostSoldProducts = [];
    for(const Id of productId) {
      const product = await productsList.findOne({ "_id": Id });
      MostSoldProducts.push(product);
    }

    const brandCount = {};
    for (const productArr of totalproductsInThisYear) {
      for (const product of productArr) {
        if (!brandCount[product.product_brand]) {
        brandCount[product.product_brand] = 1;
      } else {
        brandCount[product.product_brand] += 1;
      }
      }
    }

    // Sort the object by key in descending order
   const brandSortedData = Object.entries(brandCount)
  .sort(([, a], [, b]) => b - a) // Sort by values in descending order
  .reduce((acc, [key, value]) => {
    acc[key] = value; // Rebuild the object with sorted values
    return acc;
  }, {});

    const brandsNames = Object.keys(brandSortedData);
    const brandCounts = Object.values(brandSortedData);
    const totalBrandsCount = brandCounts.reduce((acc, brand) => acc += brand, 0);
    const brandCountPercentages = [];

    for(const value of brandCounts) {
      brandCountPercentages.push(value * 100 / totalBrandsCount);
    }

    // Render the admin dashboard page
    res.render(
      "admin/adminDashBoardPage", 
      { 
        admin, 
        brands, 
        dailyTotalRevenue,
        dailyPercentageChange: dailyPercentageChange.toFixed(),
        dailyProfit,
        profitPercentageChange: profitPercentageChange.toFixed(),
        dailyOrdersCount,
        orderPercentage: orderPercentage.toFixed(),
        customerCount,
        weeklySalesChartData: weeklyChartData,
        totalWeeklySales,
        categories,
        categoryPercentages,
        MostSoldProducts,
        brandsNames,
        brandCountPercentages
      }
    );
  } catch (error) {
    // Log any errors that occur during the rendering process
    console.error("Failed to render the admin dashboard:", error);

    // Send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Failed to render the admin dashboard");
  }
};

export const adminDashBoardPageChartFilter = async (req, res) => {
  const filter = req.query.filter;

  let startDate = '';
  let endDate = '';

  switch (filter) {
    case "week":
      startDate = startOfWeek;
      endDate = endOfWeek;
      break;
    case "month":
      startDate = startOfMonth;
      endDate = endOfMonth;
      break;
    case "year":
      startDate = startOfYear;
      endDate = endOfYear;
      break;
    default:
      return res.status(400).json({ message: "Invalid filter" });
  }

  try {
    
    // Get the weekly order details
      const orders = await getOrderDetails(startDate, endDate);

      // Get the grouped data 
      const GrouedData = groupDataByDate(orders);
      const chartData = prepareChartData(GrouedData);

      // Get the weekly total sales
      const totalSales = totalSalesAmountCalculator(orders);

      res.json({
      sales: chartData.sales,               // Sales data for the chart
      profits: chartData.profits,           // Profit data for the chart
      categories: chartData.categories,     // X-axis categories (dates)
      totalSales: totalSales,               // Overall sales
    });

  } catch (error) {
    res.status(500).json({ message: `Failed to fetch the data!! Please try again` });
  }
};
