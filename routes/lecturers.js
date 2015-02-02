module.exports = function (server, mysql_conn, prefix, restify) {
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

				return res.send(results);
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
	 * Retrieves a list of lecturers from the database.
	 */
	server.get(prefix + '/lecturers', function (req, res, next) {
		mysql_conn.query('SELECT * FROM `lecturers`', function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});
};