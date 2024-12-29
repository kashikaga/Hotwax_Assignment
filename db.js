// db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mini@123',
    database: 'hotwax'
});

connection.connect(err => {
    if (err) throw err;
    console.log('Connected to the database.');
});

module.exports = connection;
