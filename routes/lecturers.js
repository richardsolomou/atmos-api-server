module.exports = function (server, mysql_conn, prefix, restify) {
	// Load module dependencies.
	var async = require('async'),
		winston = require('winston');

	// Setup logging module.
	var logger = new winston.Logger({
		transports: [
			new winston.transports.File({ filename: require('path').dirname(require.main.filename) + '/logs/debug.log' })
		],
		exceptionHandlers: [
			new winston.transports.File({ filename: require('path').dirname(require.main.filename) + '/logs/exceptions.log' })
		],
		exitOnError: false
	});

	/**
	 * Retrieves the units of a specific lecturer from the database.
	 */
	server.get(prefix + '/lecturers/:lecturer_id/units', function (req, res, next) {
		mysql_conn.query('SELECT * FROM `lecturers` WHERE `lecturer_id` = :lecturer_id', { lecturer_id: req.params.lecturer_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid lecturer ID.'));

			mysql_conn.query('SELECT `units`.* FROM `lecturersessions` INNER JOIN `sessions` ON `lecturersessions`.`session_id` = `sessions`.`session_id` INNER JOIN `units` ON `units`.`unit_id` = `sessions`.`unit_id` WHERE `lecturersessions`.`lecturer_id` = :lecturer_id GROUP BY `units`.`unit_id`', { lecturer_id: req.params.lecturer_id }, function (err, results) {
				if (err) return next(err);

				return res.send(results);
			});
		});
	});

	/**
	 * Retrieves the sessions of a specific lecturer from the database.
	 */
	server.get(prefix + '/lecturers/:lecturer_id/sessions', function (req, res, next) {
		mysql_conn.query('SELECT * FROM `lecturers` WHERE `lecturer_id` = :lecturer_id', { lecturer_id: req.params.lecturer_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid lecturer ID.'));

			mysql_conn.query('SELECT `sessions`.* FROM `lecturersessions` INNER JOIN `sessions` ON `lecturersessions`.`session_id` = `sessions`.`session_id` WHERE `lecturersessions`.`lecturer_id` = :lecturer_id', { lecturer_id: req.params.lecturer_id }, function (err, results) {
				if (err) return next(err);

				if (req.query.populate && req.query.populate == 'unit_id') {
					async.each(results, function (session, callback) {
						mysql_conn.query('SELECT * FROM `units` WHERE `unit_id` = :unit_id', { unit_id: session.unit_id }, function (err, units) {
							session.unit_id = units[0];
							callback();
						});
					}, function () {
						return res.send(results);
					});
				} else {
					return res.send(results);
				}
			});
		});
	});

	/**
	 * Retrieves a specific lecturer from the database.
	 */
	server.get(prefix + '/lecturers/:lecturer_id', function (req, res, next) {
		mysql_conn.query('SELECT * FROM `lecturers` WHERE `lecturer_id` = :lecturer_id', { lecturer_id: req.params.lecturer_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid lecturer ID.'));

			return res.send(results[0]);
		});
	});

    /**
     * Updates a specific lecturer.
     */
	server.put(prefix + '/lecturers/:lecturer_id', function (req, res, next) {
		mysql_conn.query('UPDATE `lecturers` SET `lecturer_name` = :lecturer_name, `lecturer_email` = :lecturer_email WHERE `lecturer_id` = :lecturer_id', { lecturer_id: req.params.lecturer_id, lecturer_name: req.params.lecturer_name, lecturer_email: req.params.lecturer_email }, function (err, results) {
			if (err) return next(err);
			
			return res.send(results);
		});
	});

	/**
	 * Retrieves a list of lecturers from the database.
	 */
	server.get(prefix + '/lecturers', function (req, res, next) {
		mysql_conn.query('SELECT * FROM `lecturers`', function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});
};