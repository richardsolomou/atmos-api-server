/********************************
 * Module dependencies.
 *******************************/

// Load global module dependencies.
var restify	=	require('restify'),
	mysql	=	require('mysql'),
	util	=	require('util');

// Load the configuration and set the API prefix.
var config	=	require('./config'),
	prefix	=	'/atmos/api/v2';


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
				var status = (body.status) ? body.status : 200;
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

/**
 * Retrieves the attendance log of a specific student from the database.
 */
server.get(prefix + '/students/:student_id/attendance', function (req, res) {
	mysql_conn.query('SELECT `attendance`.`event_id`, `attendance`.`recorded_at`, `events`.`session_id` FROM `attendance` INNER JOIN `events` ON `attendance`.`event_id` = `events`.`id` WHERE `attendance`.`student_id` = :student_id', { student_id: req.params.student_id }, function (err, results) {
		if (err) {
			return res.send(err);
		}

		if (!results || !results.length) {
			err = new Error('Invalid student ID.');
			err.status = 404;
			return res.send(err);
		}

		return res.send(results);
	});
});

/**
 * Retrieves a specific student from the database.
 */
server.get(prefix + '/students/:student_id', function (req, res) {
	mysql_conn.query('SELECT * FROM `students` WHERE `id` = :student_id', { student_id: req.params.student_id }, function (err, results) {
		if (err) {
			return res.send(err);
		}

		if (!results || !results.length) {
			err = new Error('Invalid student ID.');
			err.status = 404;
			return res.send(err);
		}

		return res.send(results[0]);
	});
});

/**
 * Retrieves a list of students from the database.
 */
server.get(prefix + '/students', function (req, res) {
	mysql_conn.query('SELECT * FROM `students`', function (err, results) {
		if (err) {
			return res.send(err);
		}

		if (!results || !results.length) {
			err = new Error('Table is empty.');
			err.status = 404;
			return res.send(err);
		}

		return res.send(results);
	});
});


/********************************
 * Listens for connections.
 *******************************/
server.listen(config.port, function () {
	console.log('%s listening at %s', server.name, server.url);
});