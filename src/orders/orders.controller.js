const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

// Middleware: Check if an order with a given ID exists
const orderExists = (req, res, next) => {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order id not found: ${orderId}`,
    });
};

// Middleware: Validate order properties
const validateOrder = (req, res, next) => {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    if (!deliverTo) return next({ status: 400, message: "Order must include a deliverTo" });
    if (!mobileNumber) return next({ status: 400, message: "Order must include a mobileNumber" });
    if (!dishes || !Array.isArray(dishes) || dishes.length === 0) return next({ status: 400, message: "Order must include at least one dish" });

    dishes.forEach((dish, index) => {
        if (!dish.quantity || !Number.isInteger(dish.quantity) || dish.quantity <= 0) {
            return next({ status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0` });
        }
    });

    next();
};

// Middleware: Validate order status
const validateOrderStatus = (req, res, next) => {
    const { data: { status } = {} } = req.body;
    if (!status || !["pending", "preparing", "out-for-delivery", "delivered"].includes(status)) {
        return next({ status: 400, message: "Order must have a status of pending, preparing, out-for-delivery, delivered" });
    }
    if (res.locals.order && res.locals.order.status === "delivered") {
        return next({ status: 400, message: "A delivered order cannot be changed" });
    }
    next();
};

// Route handler: Get all orders
const list = (req, res) => {
    res.json({ data: orders });
};

// Route handler: Create a new order
const create = (req, res) => {
    const { data: { deliverTo, mobileNumber, status = "pending", dishes } = {} } = req.body;
    const newOrder = { 
      id: nextId(), 
      deliverTo, 
      mobileNumber, 
      status, 
      dishes 
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
};

// Route handler: Get a specific order
const read = (req, res) => {
    res.json({ data: res.locals.order });
};

// Route handler: Update an existing order
const update = (req, res, next) => {
    const { orderId } = req.params;
    const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    if (id && id !== orderId) 
      return next({ 
        status: 400, 
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}` 
      });

    Object.assign(res.locals.order, { deliverTo, mobileNumber, status, dishes });
    res.json({ data: res.locals.order });
};

// Route handler: Delete an order by ID
const remove = (req, res, next) => {
    const { orderId } = req.params;
    const index = orders.findIndex(order => order.id === orderId);
    if (index !== -1) {
        if (orders[index].status !== "pending") {
            return next({ 
              status: 400, 
              message: "An order cannot be deleted unless it is pending" });
        }
        orders.splice(index, 1);
        res.sendStatus(204);
    } else {
        next({
            status: 404,
            message: `Order id not found: ${orderId}`,
        });
    }
};

module.exports = {
    list,
    create: [validateOrder, create],
    read: [orderExists, read],
    update: [orderExists, validateOrder, validateOrderStatus, update],
    remove: [orderExists, remove],
};
