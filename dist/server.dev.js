"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// server.js
var express = require('express');

var bodyParser = require('body-parser');

var db = require('./db');

var app = express();
app.use(bodyParser.json());
var PORT = process.env.PORT || 3000; // Start the server

app.listen(PORT, function () {
  console.log("Server is running on port ".concat(PORT));
}); // server.js (continued)
// POST /orders - Create a new order

app.post('/orders', function (req, res) {
  var _req$body = req.body,
      order_date = _req$body.order_date,
      customer_id = _req$body.customer_id,
      shipping_contact_mech_id = _req$body.shipping_contact_mech_id,
      billing_contact_mech_id = _req$body.billing_contact_mech_id,
      order_items = _req$body.order_items; // Validate input

  if (!order_date || !customer_id || !shipping_contact_mech_id || !billing_contact_mech_id || !order_items || !Array.isArray(order_items)) {
    return res.status(400).json({
      error: 'Invalid input data'
    });
  } // Insert into Order_Header table


  var orderHeaderQuery = "INSERT INTO Order_Header (order_date, customer_id, shipping_contact_mech_id, billing_contact_mech_id) VALUES (?, ?, ?, ?)";
  db.query(orderHeaderQuery, [order_date, customer_id, shipping_contact_mech_id, billing_contact_mech_id], function (err, result) {
    if (err) {
      return res.status(500).json({
        error: 'Database error while creating order header'
      });
    }

    var orderId = result.insertId; // Get the newly created order ID
    // Prepare to insert order items

    var orderItemsQuery = "INSERT INTO Order_Item (order_id, product_id, quantity, status) VALUES ?";
    var orderItemsValues = order_items.map(function (item) {
      return [orderId, item.product_id, item.quantity, item.status];
    }); // Insert all order items

    db.query(orderItemsQuery, [orderItemsValues], function (err) {
      if (err) {
        return res.status(500).json({
          error: 'Database error while creating order items'
        });
      } // Respond with success message and created order details


      res.status(201).json({
        message: 'Order created successfully',
        orderId: orderId
      });
    });
  });
}); // GET /orders/:order_id - Retrieve details of a specific order

app.get('/orders/:order_id', function (req, res) {
  var orderId = req.params.order_id; // SQL query to retrieve order details

  var orderDetailQuery = "\n        SELECT \n            oh.order_id,\n            oh.order_date AS \"date\",\n            c.first_name AS \"firstName\",\n            c.last_name AS \"lastName\",\n            CONCAT(cm1.street_address,' ', cm1.city,' ', cm1.state,' ', cm1.postal_code) AS \"shippingAddress\",\n            cm1.phone_number AS \"shippingContact\",\n            cm1.email AS \"shippingEmail\",\n            CONCAT(cm2.street_address,' ',cm2.city,' ', cm2.state,' ',cm2.postal_code) AS \"billingAddress\"\n        FROM \n            Order_Header AS oh \n        JOIN \n            Customer AS c ON oh.customer_id = c.customer_id \n        JOIN \n            Contact_Mech AS cm1 ON oh.shipping_contact_mech_id = cm1.contact_mech_id \n        JOIN \n            Contact_Mech AS cm2 ON oh.billing_contact_mech_id = cm2.contact_mech_id \n        WHERE \n            oh.order_id = ?";
  db.query(orderDetailQuery, [orderId], function (err, results) {
    if (err) {
      return res.status(500).json({
        error: 'Database error while retrieving order details'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    var orderDetails = results[0]; // Get the first result as we expect one record
    // Query to retrieve associated order items

    var orderItemsQuery = "\n            SELECT \n                oi.order_item_seq_id,\n                oi.order_id,\n                oi.product_id,\n                oi.quantity,\n                oi.status,\n                p.product_name,\n                p.color,\n                p.size\n            FROM \n                Order_Item AS oi \n            INNER JOIN \n                Product AS p ON oi.product_id = p.product_id \n            WHERE \n                oi.order_id = ?";
    db.query(orderItemsQuery, [orderId], function (err, items) {
      if (err) {
        return res.status(500).json({
          error: 'Database error while retrieving order items'
        });
      } // Combine the results and send response


      res.status(200).json(_objectSpread({}, orderDetails, {
        items: items // Include the associated items in the response

      }));
    });
  });
});
//# sourceMappingURL=server.dev.js.map
