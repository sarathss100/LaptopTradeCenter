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

    // Extract Order details from the Database
    let orderDetails = await Order.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    orderDetails = orderDetails.filter((order) => {
      if (order.orderStatus === "Delivered") return order;
    });

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

    // extract daily order details
    const dailyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDay,
            $lt: endOfDay,
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
      {
        $skip: skip, // Add the skip stage
      },
      {
        $limit: limit, // Add the limit stage
      },
    ]);

    // extract weekly order details
    const weeklyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfWeek,
            $lt: endOfWeek,
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
    ]);

    // Extract monthly order details
    const monthlyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lt: endOfMonth,
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
      {
        $skip: skip, // Add the skip stage
      },
      {
        $limit: limit, // Add the limit stage
      },
    ]);

    // Extract annual order details
    const annualOrders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lt: endOfMonth,
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
      {
        $skip: skip, // Add the skip stage
      },
      {
        $limit: limit, // Add the limit stage
      },
    ]);

    // For showing inside the tabs
    const dailySalesAmount = totalSalesAmountCalculator(dailyOrders);
    const weeklySalesAmount = totalSalesAmountCalculator(weeklyOrders);
    const monthlySalesAmount = totalSalesAmountCalculator(monthlyOrders);
    const annualSalesAmount = totalSalesAmountCalculator(annualOrders);

    // For Sales Report Table
    const totalOrders = totalOrderCounter(dailyOrders);
    const dailyTotalOrders = totalOrders;
    const dailyDiscountDeductionAmount =
      totalDiscountDeductionAmountCalculator(dailyOrders);
    const dailyCouponDeductionAmount =
      totalCouponDeductionAmountCalculator(dailyOrders);

    for (let order of dailyOrders) {
      if (order.products.length >= 1) {
        for (let product of order.products) {
          // console.log(product);
        }
      }
    }

    // Extract unique brand names from the product details
    const brands = await brand.find({ isBlocked: false }).populate("products");

    // Render the admin dashboard page
    res.render("admin/adminSalesReportPage", {
      admin,
      brands,
      dailySalesAmount,
      weeklySalesAmount,
      monthlySalesAmount,
      annualSalesAmount,
      dailyTotalOrders,
      dailyDiscountDeductionAmount,
      dailyCouponDeductionAmount,
      dailyOrders,
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
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calculate how many days to subtract to get to Monday

      // Set start of the week to Monday (or a suitable first day of the week)
      startOfDay = new Date(today);
      startOfDay.setDate(today.getDate() + diff); // Adjust to the correct day
      startOfDay.setHours(0, 0, 0, 0); // Set time to start of the day

      // Set end of the week to Sunday
      endOfDay = new Date(startOfDay);
      endOfDay.setDate(startOfDay.getDate() + 6); // Add 6 days to get to Sunday
      endOfDay.setHours(23, 59, 59, 999); // Set time to end of the day
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

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0); // Set to the start of the current day

      // Validate dates
      if (isNaN(startOfDay.getTime()) || isNaN(endOfDay.getTime())) {
        return res.status(400).json({ message: "Invalid custom date range" });
      }

      // Ensure the start and end dates are not in the future
      if (startOfDay > todayDate || endOfDay > todayDate) {
        console.log("comes here");
        return res
          .status(400)
          .json({ message: "Date range cannot exceed current date" });
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

    // Extracting details
    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDay,
            $lt: endOfDay,
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
      {
        $skip: skip, // Add the skip stage
      },
      {
        $limit: limit, // Add the limit stage
      },
    ]);

    // Get total count of orders in the specified date range (without pagination)
    const totalOrders = totalOrderCounter(orders);

    // Calculating Total Sales and other values
    const dailyTotalSales = totalOrders;
    const dailySalesAmount = totalSalesAmountCalculator(orders);
    const dailyDiscountDeductionAmount =
      totalDiscountDeductionAmountCalculator(orders);
    const dailyCouponDeductionAmount =
      totalCouponDeductionAmountCalculator(orders);

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
