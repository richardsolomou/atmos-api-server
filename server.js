/********************************
 * Module dependencies.
 *******************************/

// Load global module dependencies.
var restify =   require('restify'),
	mysql   =   require('mysql'),
	util    =   require('util');

// Load the configuration and set the API prefix.
var config  =   require('./config'),
	prefix  =   '/atmos/api/v2';


/********************************
 * Module cofiguration.
 *******************************/

// Setup connection to the MySQL database.
var mysql_conn = mysql.createConnection(config.db);

// Implement a custom format for query escaping.
mysql_conn.config.queryFormat = function (query, values) {
	if (!values) return query;
	return query.replace(/\:(\w+)/g, function (txt, key) {
		if (values.hasOwnProperty(key)) return this.escape(values[key]);
		return txt;
	}.bind(this));
};

// Initialize restify.
var server = restify.createServer({
	formatters: {
		'application/json': function (req, res, body) {
			if (body instanceof Error) {
				var status = (body.status) ? body.status : 400;
				delete body.status;
				body = {
					error: {
						message: body.message,
						status: status
					}
				};
			} else {
				var status = (body.status) ? body.status : 200;
				delete body.status;
				body = {
					data: body,
					status: status
				};
			}

			body = JSON.stringify(body);
			res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'));
			return body;
		}
	}
});


/********************************
 * Route cofiguration.
 *******************************/
require('./routes/lecturers')(server, mysql_conn, prefix, restify);
require('./routes/students')(server, mysql_conn, prefix, restify);


/********************************
 * Listens for connections.
 *******************************/
server.listen(config.port, function () {
	console.log('%s listening at %s', server.name, server.url);
});