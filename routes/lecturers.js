module.exports = function (server, connection, prefix, restify) {
	// Load module dependencies.
	var async = require('async');

	/**
	 * Gets a lecturer's units.
	 * GET /lecturers/{{ LECTURER_ID }}/units
	 */
	server.get(prefix + '/lecturers/:lecturer_id/units', function (req, res, next) {
		connection.query('SELECT `units`.* FROM `lecturersessions` INNER JOIN `sessions` ON `lecturersessions`.`session_id` = `sessions`.`session_id` INNER JOIN `units` ON `units`.`unit_id` = `sessions`.`unit_id` WHERE `lecturersessions`.`lecturer_id` = :lecturer_id GROUP BY `units`.`unit_id`', { lecturer_id: req.params.lecturer_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Gets a lecturer's sessions.
	 * GET /lecturers/{{ LECTURER_ID }}/sessions
	 */
	server.get(prefix + '/lecturers/:lecturer_id/sessions', function (req, res, next) {
		connection.query('SELECT `sessions`.* FROM `lecturersessions` INNER JOIN `sessions` ON `lecturersessions`.`session_id` = `sessions`.`session_id` WHERE `lecturersessions`.`lecturer_id` = :lecturer_id', { lecturer_id: req.params.lecturer_id }, function (err, results) {
			if (err) return next(err);

			if (req.query.populate && req.query.populate == 'unit_id') {
				async.each(results, function (session, callback) {
					connection.query('SELECT * FROM `units` WHERE `unit_id` = :unit_id', { unit_id: session.unit_id }, function (err, units) {
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

	/**
	 * Creates a lecturer.
	 * POST /lecturers
	 */
	server.post(prefix + '/lecturers', function (req, res, next) {
		connection.query('INSERT INTO `lecturers` (`lecturer_id`, `lecturer_name`, `lecturer_email`) VALUES (:lecturer_id, :lecturer_name, :lecturer_email)', { lecturer_id: req.params.lecturer_id, lecturer_name: req.params.lecturer_name, lecturer_email: req.params.lecturer_email }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Gets a lecturer.
	 * GET /lecturers/{{ LECTURER_ID }}
	 */
	server.get(prefix + '/lecturers/:lecturer_id', function (req, res, next) {
		connection.query('SELECT * FROM `lecturers` WHERE `lecturer_id` = :lecturer_id', { lecturer_id: req.params.lecturer_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid lecturer ID.'));

			return res.send(results[0]);
		});
	});

	/**
	 * Gets a list of lecturers.
	 * GET /lecturers
	 */
	server.get(prefix + '/lecturers', function (req, res, next) {
		connection.query('SELECT * FROM `lecturers`', function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Updates a lecturer.
	 * PUT /lecturers/{{ LECTURER_ID }}
	 */
	server.put(prefix + '/lecturers/:lecturer_id', function (req, res, next) {
		connection.query('UPDATE `lecturers` SET `lecturer_name` = :lecturer_name, `lecturer_email` = :lecturer_email WHERE `lecturer_id` = :lecturer_id', { lecturer_id: req.params.lecturer_id, lecturer_name: req.params.lecturer_name, lecturer_email: req.params.lecturer_email }, function (err, results) {
			if (err) return next(err);
			
			return res.send(results);
		});
	});

	/**
	 * Deletes a lecturer.
	 * DELETE /lecturers/{{ LECTURER_ID }}
	 */
	server.del(prefix + '/lecturers/:lecturer_id', function (req, res, next) {
		connection.query('DELETE FROM `lecturers` WHERE `lecturer_id` = :lecturer_id', { lecturer_id: req.params.lecturer_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});
};