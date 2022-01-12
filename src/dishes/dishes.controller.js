const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function hasCorrectProperties(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  if (name && description && price && image_url) {
    res.locals.name = name;
    res.locals.description = description;
    res.locals.price = price;
    res.locals.image_url = image_url;
    next();
  } else {
    next({
      status: 400,
      message:
        "Dish must include 'name', 'description', 'price', and 'image_url' properties.",
    });
  }
}

function priceIsValid(req, res, next) {
  const price = res.locals.price;
  if (typeof price === "number" && price > 0) {
    next();
  } else {
    next({
      status: 400,
      message:
        "Dish must have a price that is an integer which is greater than 0.",
    });
  }
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    next();
  } else {
    next({
      status: 404,
      message: `No dish found with id ${dishId}.`,
    });
  }
}

function dishMatches(req, res, next) {
  const {
    data: { id },
  } = req.body;
  const originalId = res.locals.dish.id;
  if (id === originalId || !id) {
    next();
  } else {
    next({
      status: 400,
      message: `Dish id '${id}' must match router id`,
    });
  }
}

function update(req, res) {
  const originalDish = res.locals.dish;
  const { name, description, price, image_url } = res.locals;

  originalDish.name !== name ? (originalDish.name = name) : null;
  originalDish.description !== description
    ? (originalDish.description = description)
    : null;
  originalDish.price !== price ? (originalDish.price = price) : null;
  originalDish.image_url !== image_url
    ? (originalDish.image_url = image_url)
    : null;

  res.json({ data: originalDish });
}

function read(req, res) {
  const dish = res.locals.dish;
  res.json({ data: dish });
}

function create(req, res) {
  const { data: dish = {} } = req.body;
  const newDish = {
    id: nextId(),
    ...dish,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
  list,
  create: [hasCorrectProperties, priceIsValid, create],
  read: [dishExists, read],
  update: [dishExists, dishMatches, hasCorrectProperties, priceIsValid, update],
};
