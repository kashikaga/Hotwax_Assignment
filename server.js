// server.js
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// server.js (continued)

// POST /orders - Create a new order
app.post('/orders', (req, res) => {
    const { order_date, customer_id, shipping_contact_mech_id, billing_contact_mech_id, order_items } = req.body;

    // Validate input
    if (!order_date || !customer_id || !shipping_contact_mech_id || !billing_contact_mech_id || !order_items || !Array.isArray(order_items)) {
        return res.status(400).json({ error: 'Invalid input data' });
    }

    // Insert into Order_Header table
    const orderHeaderQuery = `INSERT INTO Order_Header (order_date, customer_id, shipping_contact_mech_id, billing_contact_mech_id) VALUES (?, ?, ?, ?)`;
    
    db.query(orderHeaderQuery, [order_date, customer_id, shipping_contact_mech_id, billing_contact_mech_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error while creating order header' });
        }

        const orderId = result.insertId; // Get the newly created order ID

        // Prepare to insert order items
        const orderItemsQuery = `INSERT INTO Order_Item (order_id, product_id, quantity, status) VALUES ?`;
        const orderItemsValues = order_items.map(item => [orderId, item.product_id, item.quantity, item.status]);

        // Insert all order items
        db.query(orderItemsQuery, [orderItemsValues], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error while creating order items' });
            }

            // Respond with success message and created order details
            res.status(201).json({ message: 'Order created successfully', orderId });
        });
    });
});

// GET /orders/:order_id - Retrieve details of a specific order
app.get('/orders/:order_id', (req, res) => {
    const orderId = req.params.order_id;

    // SQL query to retrieve order details
    const orderDetailQuery = `
        SELECT 
            oh.order_id,
            oh.order_date AS "date",
            c.first_name AS "firstName",
            c.last_name AS "lastName",
            CONCAT(cm1.street_address,' ', cm1.city,' ', cm1.state,' ', cm1.postal_code) AS "shippingAddress",
            cm1.phone_number AS "shippingContact",
            cm1.email AS "shippingEmail",
            CONCAT(cm2.street_address,' ',cm2.city,' ', cm2.state,' ',cm2.postal_code) AS "billingAddress"
        FROM 
            Order_Header AS oh 
        JOIN 
            Customer AS c ON oh.customer_id = c.customer_id 
        JOIN 
            Contact_Mech AS cm1 ON oh.shipping_contact_mech_id = cm1.contact_mech_id 
        JOIN 
            Contact_Mech AS cm2 ON oh.billing_contact_mech_id = cm2.contact_mech_id 
        WHERE 
            oh.order_id = ?`;

    db.query(orderDetailQuery, [orderId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error while retrieving order details' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const orderDetails = results[0]; // Get the first result as we expect one record

        // Query to retrieve associated order items
        const orderItemsQuery = `
            SELECT 
                oi.order_item_seq_id,
                oi.order_id,
                oi.product_id,
                oi.quantity,
                oi.status,
                p.product_name,
                p.color,
                p.size
            FROM 
                Order_Item AS oi 
            INNER JOIN 
                Product AS p ON oi.product_id = p.product_id 
            WHERE 
                oi.order_id = ?`;

        db.query(orderItemsQuery, [orderId], (err, items) => {
            if (err) {
                return res.status(500).json({ error: 'Database error while retrieving order items' });
            }

            // Combine the results and send response
            res.status(200).json({
                ...orderDetails,
                items: items // Include the associated items in the response
            });
        });
    });
});
