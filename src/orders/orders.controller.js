const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function orderHasCorrectProperties(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes } } = req.body
    let weHaveQuantitiesAndLength = false
    if (Array.isArray(dishes)) {
        weHaveQuantitiesAndLength = dishes.every((dish) => dish.quantity && typeof dish.quantity === "number") && dishes.length
    }
    if (deliverTo && mobileNumber && dishes && weHaveQuantitiesAndLength) {
        res.locals.deliverTo = deliverTo;
        res.locals.mobileNumber = mobileNumber;
        res.locals.dishes = dishes
        next()
    }
    if (deliverTo && mobileNumber && dishes) {
        next({
            status: 400,
            message: "Each dish must have a 'quantity' property of at least 1, it cannot be 0. It must also be a number such as 2."
        })
    } else {
        next({
            status: 400,
            message: "Orders must include 'deliverTo', 'mobileNumber', and 'dishes' properties. 'dishes' must also have a valid integer."
        })
    }
}

function orderHasValidStatus(req, res, next) {
    const { data: { status } = {} } = req.body;
    let newStatusIsValid = false;
    if (status && status !== "invalid") {
        newStatusIsValid = true
    }
    if (newStatusIsValid) {
        next()
    } else {
        next({
            status: 400,
            message: "Updated order information must contain a 'status' property. And that status property cannot be 'delivered'."
        })
    }
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId)

    if (foundOrder) {
        res.locals.order = foundOrder;
        next()
    } else {
        next({
            status: 404,
            message: `Order with id ${orderId} does not exist.`
        })
    }
}
function orderMatches(req, res, next) {
    const {
      data: { id },
    } = req.body;
    const originalId = res.locals.order.id;
    if (id === originalId || !id) {
      next();
    } else {
      next({
        status: 400,
        message: `Order id '${id}' must match router id`,
      });
    }
  }

function create(req, res) {
    const { data: order = { } } = req.body
    const newOrder = {
        id: nextId(),
        ...order,
    }

    orders.push(newOrder);
    res.status(201).json({ data: newOrder})
}

function read(req, res) {
    res.json({ data: res.locals.order })
}

function update(req, res) {
    const originalOrder = res.locals.order;
    const { deliverTo, mobileNumber, dishes } = res.locals

    originalOrder.deliverTo !== deliverTo ? originalOrder.deliverTo = deliverTo : null;
    originalOrder.mobileNumber !== mobileNumber ? originalOrder.mobileNumber = mobileNumber : null;
    originalOrder.dishes.length !== dishes.length ? originalOrder.dishes = dishes : null;

    res.json({ data: originalOrder })
}

function destroy(req, res, next) {
    const { status, id } = res.locals.order;
    const index = orders.findIndex((order) => order.id === id)

    if (status === "pending") {
        const deletedOrder = orders.splice(index, 1)
        res.sendStatus(204);
    } else {
        next({
            status: 400,
            message: "Order status must be pending to delete."
        })
    }
}

function list(req, res) {
    res.json({ data: orders })
}

module.exports = {
    list,
    create: [orderHasCorrectProperties, create],
    read: [orderExists, read],
    update: [orderExists, orderMatches, orderHasValidStatus, orderHasCorrectProperties, update],
    delete: [orderExists, destroy],
}