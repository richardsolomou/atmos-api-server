/**
 * Module dependencies.
 */

// Load global module dependencies.
var restify = require('restify'),
	mysql = require('mysql');

// Set the port and load the configuration.
var port = process.env.PORT || 4000,
	config = require('./config');


/**
 * Module configuration.
 */

// Initialize restify.
var server = restify.createServer();
// Setup connection to the MySQL database.
var mysql_conn = mysql.createConnection(config.db);
var path = '/atmos/api/v2';


/**
 * Route cofiguration.
 */

server.get(path + '/students', function (req, res) {
	// Run a MySQL query to get a specific user.
	mysql_conn.query('SELECT * FROM `students`', function (err, results) {
		// Return appropriate error messages if something went wrong.
		if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
		if (!results || !results.length) return res.json(404, { error: { message: 'Invalid reference.', code: 404 } });
		// Return the user in JSON format.
		return res.json(results);
	});
});

server.get(path + '/students/:reference', function (req, res) {
	// Run a MySQL query to get a specific user.
	mysql_conn.query('SELECT * FROM `students` WHERE `reference` = "' + req.params.reference + '"', function (err, results) {
		// Return appropriate error messages if something went wrong.
		if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
		if (!results || !results.length) return res.json(404, { error: { message: 'Invalid reference.', code: 404 } });
		// Return the user in JSON format.
		return res.json(results[0]);
	});
});


// Listen for connections.
server.listen(port, function () {
	console.log('%s listening at %s', server.name, server.url);
});