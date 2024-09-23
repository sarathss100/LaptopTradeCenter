import { brands as brand } from "../../models/brandModel.mjs";
import { Order } from "../../models/orderModel.mjs";

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
export const adminSalesReport = async (req, res) => {
  try {
    const admin = req.user;

    // Extract page and limit from query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Extract total number of orders for pagination calculation
    const totalOrders = await Order.countDocuments();

    // Extract Order details from the Database
    const orderDetails = await Order.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const calculateTotal = function (sales) {
      return sales.reduce((acc, sales) => {
        acc += sales.totalAmount;
        return acc;
      }, 0);
    };

    const calculateDiscountTotal = function (sales) {
      return sales.reduce((acc, sales) => {
        acc += sales.totalDiscountDeduction;
        return acc;
      }, 0);
    };

    const calculateCouponTotal = function (sales) {
      return sales.reduce((acc, sales) => {
        acc += sales.totalCouponDeduction;
        return acc;
      }, 0);
    };

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

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

    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalAmount: { $sum: "$totalAmount" },
          totalDiscountDeduction: { $sum: "$discountDeduction" },
          totalCouponDeduction: { $sum: "$couponDeduction" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const dailySalesDetails = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        },
      },
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
      {
        $skip: skip, // Skip the number of documents defined by 'skip' variable
      },
      {
        $limit: limit, // Limit the number of documents to the value of 'limit' variable
      },
    ]);

    const weeklySales = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfWeek,
            $lt: endOfWeek,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    const monthlySales = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lt: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const annualSales = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lt: endOfYear,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalDiscountDeduction: { $sum: "$discountDeduction" },
          totalCouponDeduction: { $sum: "$couponDeduction" },
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1 } },
    ]);

    const annualOrderDetails = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lt: endOfYear,
          },
        },
      },
      { $sort: { "_id.year": -1 } },
    ]);

    // Daily sales details
    const dailySalesAmount = calculateTotal(dailySales);
    const dailyDiscountDeductionAmount = calculateDiscountTotal(dailySales);
    const dailyCouponDeductionAmount = calculateCouponTotal(dailySales);
    const dailyTotalSales = dailySalesDetails.length;

    const weeklySalesAmount = calculateTotal(weeklySales);
    const monthlySalesAmount = calculateTotal(monthlySales);
    const annualSalesAmount = calculateTotal(annualSales);
    const annualDiscountDeductionAmount = calculateDiscountTotal(annualSales);
    const annualCouponDeductionAmount = calculateCouponTotal(annualSales);

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false }).populate("products");

    // Render the admin dashboard page
    res.render("admin/adminSalesReportPage", {
      admin,
      brands,
      dailySalesDetails,
      dailyTotalSales,
      dailySalesAmount,
      dailyDiscountDeductionAmount,
      dailyCouponDeductionAmount,
      weeklySalesAmount,
      monthlySalesAmount,
      annualSalesAmount,
      annualDiscountDeductionAmount,
      annualCouponDeductionAmount,
      orderDetails,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      limit,
    });
  } catch (error) {
    // Log any errors that occur during the rendering process
    console.error("Failed to render the admin dashboard:", error);

    // Send a 500 Internal Server Error response if an error occurs
    res.status(500).send("Failed to render the admin dashboard");
  }
};

export const filter = async (req, res) => {
  const filter = req.query.filter;

  // Extract page and limit from query parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let startOfDay, endOfDay;

  switch (filter) {
    case "day":
      startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      break;
    case "week":
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const firstDayOfWeek = now.getDate() - daysToSubtract;
      const lastDayOfWeek = firstDayOfWeek + 6; // Last day of the week
      startOfDay = new Date(now.setDate(firstDayOfWeek));
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date();
      endOfDay = new Date(now.setDate(lastDayOfWeek));
      break;
    case "month":
      startOfDay = new Date();
      startOfDay.setDate(1);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      break;
    case "year":
      startOfDay = new Date(new Date().getFullYear(), 0, 1);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      break;
    case "custom":
      startOfDay = new Date(req.query.startDate);
      endOfDay = new Date(req.query.endDate);

      // Validate dates
      if (isNaN(startOfDay.getTime()) || isNaN(endOfDay.getTime())) {
        return res.status(400).json({ message: "Invalid custom date range" });
      }

      // Ensure end date is after start date
      if (endOfDay < startOfDay) {
        return res
          .status(400)
          .json({ message: "End date must be after start date" });
      }

      // Set time components
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay.setHours(23, 59, 59, 999);
      break;
    default:
      return res.status(400).json({ message: "Invalid filter" });
  }

  try {
    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip }, // Skip documents for pagination
      { $limit: limit }, // Limit the number of documents returned
    ]);

    // Get total count of orders in the specified date range (without pagination)
    const totalOrders = await Order.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    // Calculating Total Sales and other values
    const dailyTotalSales = orders.length;
    const dailySalesAmount = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const dailyDiscountDeductionAmount = orders.reduce(
      (sum, order) => sum + order.discountDeduction,
      0
    );
    const dailyCouponDeductionAmount = orders.reduce(
      (sum, order) => sum + order.couponDeduction,
      0
    );

    res.json({
      orders,
      totalData: {
        dailyTotalSales,
        dailySalesAmount,
        dailyDiscountDeductionAmount,
        dailyCouponDeductionAmount,
      },
      pagination: {
        totalOrders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
