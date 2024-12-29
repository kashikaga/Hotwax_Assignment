"use strict";

// db.js
var mysql = require('mysql2');

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'mini@123',
  database: 'hotwax'
});
connection.connect(function (err) {
  if (err) throw err;
  console.log('Connected to the database.');
});
module.exports = connection;
//# sourceMappingURL=db.dev.js.map
