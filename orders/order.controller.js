const express = require('express');
const router = express.Router();
const Joi = require('joi');
const orderService = require('./order.service');
const authorize = require('_middleware/authorize');
const validateRequest = require('_middleware/validate-request');
const Role = require('_helpers/role');

router.get('/', authorize([Role.Admin, Role.Manager, Role.User]), getAllOrders);
router.get('/:id', authorize([Role.Admin, Role.Manager]), getOrderById);
router.post('/', authorize([Role.User]), createOrderSchema, createOrder);
router.put('/:id', authorize([Role.Admin, Role.Manager]), updateOrderSchema, updateOrder);
router.put('/:id/cancel', authorize([Role.Admin, Role.Manager, Role.User]), cancelOrder);
router.get('/:id/status', authorize([Role.User]), trackOrderStatus);
router.put('/:id/process', authorize([Role.Admin, Role.Manager]), processOrder);
router.put('/:id/ship', authorize([Role.Admin, Role.Manager]), shipOrder);
router.put('/:id/deliver', authorize([Role.Admin, Role.Manager]), deliverOrder);


module.exports = router;

function getAllOrders(req, res, next) {
    const { role, id: accountId } = req.user; // Extract role and AccountId from authenticated user
    orderService.getAllOrders(role, accountId)
        .then(orders => res.json(orders))
        .catch(next);
}
function getOrderById(req, res, next) {
    orderService.getOrderById(req.params.id)
        .then(order => res.json(order))
        .catch(next);
}
function createOrder(req, res, next) {
    // Add the AccountId from the authenticated user to the order data
    const orderData = {
        ...req.body,
        AccountId: req.user.id  // req.user is set by the authorize middleware
    };
    
    orderService.createOrder(orderData)
        .then(order => res.json(order))
        .catch(next);
}
function createOrderSchema(req, res, next) {
    const schema = Joi.object({
        productId: Joi.number().required(), // Add productId validation
        quantity: Joi.number().positive().optional().default(1), // Add quantity validation
        shippingAddress: Joi.string().required().max(500)
    });
    validateRequest(req, next, schema);
}

// Validation schema for updating an order
function updateOrderSchema(req, res, next) {
    const schema = Joi.object({
        orderProduct: Joi.string().max(500).optional(),
        totalAmount: Joi.number().positive().optional(),
        shippingAddress: Joi.string().max(500).optional(),
        orderStatus: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').optional()
    });
    validateRequest(req, next, schema);
}
function updateOrder(req, res, next) {
    orderService.updateOrder(req.params.id, req.body)
        .then(() => res.json({ message: 'Order updated' }))
        .catch(next);
}
function cancelOrder(req, res, next) {
    orderService.cancelOrder(req.params.id)
        .then(order => res.json(order))
        .catch(next);
}
function trackOrderStatus(req, res, next) {
    orderService.trackOrderStatus(req.params.id, req.user.id) // Pass the authenticated user's ID
        .then(orderStatus => res.json({ orderStatus }))
        .catch(next);
}
function processOrder(req, res, next) {
    orderService.processOrder(req.params.id)
        .then(() => res.json({ message: 'Order processed' }))
        .catch(next);
}
function shipOrder(req, res, next) {
    orderService.shipOrder(req.params.id)
        .then(() => res.json({ message: 'Order shipped' }))
        .catch(next);
}
function deliverOrder(req, res, next) {
    orderService.deliverOrder(req.params.id)
        .then(() => res.json({ message: 'Order delivered' }))
        .catch(next);
}

