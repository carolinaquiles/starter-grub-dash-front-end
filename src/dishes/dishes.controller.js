const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

// Middleware: Check if a dish with a given ID exists
const dishExists = (req, res, next) => {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish id not found: ${dishId}`,
    });
};
// Middleware: Validate dish properties
const validateDish = (req, res, next) => {
    const { data: { name, description, price, image_url } = {} } = req.body;

    if (!name) 
      return next({ 
        status: 400, 
        message: "Dish must include a name", 
      });
    if (!description) 
      return next({ 
        status: 400, 
        message: "Dish must include a description",
      });
    if (price === undefined || price <= 0 || !Number.isInteger(price)) 
      return next({
        status: 400, 
        message: "Dish must have a price that is an integer greater than 0",
      });
    if (!image_url) 
      return next({ 
        status: 400, 
        message: "Dish must include an image_url",
      });

    next();
};

// Route handler: Get all dishes
const list = (req, res) => {
    res.json({ data: dishes });
};

// Route handler: Create a new dish
const create = (req, res) => {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = { 
      id: nextId(), 
      name, 
      description, 
      price, 
      image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
};

// Route handler: Get a specific dish
const read = (req, res) => {
    res.json({ data: res.locals.dish });
};

// Route handler: Update an existing dish
const update = (req, res, next) => {
    const { dishId } = req.params;
    const { data: { id, name, description, price, image_url } = {} } = req.body;

    if (id && id !== dishId) 
      return next({ 
        status: 400, 
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}` });

    Object.assign(res.locals.dish, { name, description, price, image_url });
    res.json({ data: res.locals.dish });
};

module.exports = {
    list,
    create: [validateDish, create],
    read: [dishExists, read],
    update: [dishExists, validateDish, update],
};
