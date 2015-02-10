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

var connection = mysql.createConnection(config.db);

// Handles disconnects to the MySQL server.
setInterval(function () {
	connection.query('SELECT 1');
}, 60000);

// Implement a custom format for query escaping.
connection.config.queryFormat = function (query, values) {
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

// Use query parser.
server.use(restify.queryParser());


/********************************
 * Route cofiguration.
 *******************************/
require('./routes/lecturers')(server, connection, prefix, restify);
require('./routes/students')(server, connection, prefix, restify);
require('./routes/sessions')(server, connection, prefix, restify);
require('./routes/units')(server, connection, prefix, restify);


/********************************
 * Listens for connections.
 *******************************/
server.listen(config.port, function () {
	console.log('%s listening at %s', server.name, server.url);
});