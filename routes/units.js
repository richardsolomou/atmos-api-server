module.exports = function (server, connection, prefix, restify) {
	/**
	 * Retrieves the students of a specific session from the database.
	 */
	server.get(prefix + '/units/:unit_id/students', function (req, res, next) {
		connection.query('SELECT * FROM `units` WHERE `unit_id` = :unit_id', { unit_id: req.params.unit_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid unit ID.'));

			connection.query('SELECT `students`.* FROM `studentsessions` INNER JOIN `sessions` ON `studentsessions`.`session_id` = `sessions`.`session_id` INNER JOIN `students` ON `studentsessions`.`student_id` = `students`.`student_id` WHERE `sessions`.`unit_id` = :unit_id GROUP BY `students`.`student_id`', { unit_id: req.params.unit_id }, function (err, results) {
				if (err) return next(err);

				return res.send(results);
			});
		});
	});

	/**
	 * Retrieves the sessions of a specific unit from the database.
	 */
	server.get(prefix + '/units/:unit_id/sessions', function (req, res, next) {
		connection.query('SELECT * FROM `units` WHERE `unit_id` = :unit_id', { unit_id: req.params.unit_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid unit ID.'));

			connection.query('SELECT * FROM `sessions` WHERE `unit_id` = :unit_id', { unit_id: req.params.unit_id }, function (err, results) {
				if (err) return next(err);

				return res.send(results);
			});
		});
	});

	/**
	 * Retrieves a specific unit from the database.
	 */
	server.get(prefix + '/units/:unit_id', function (req, res, next) {
		connection.query('SELECT * FROM `units` WHERE `unit_id` = :unit_id', { unit_id: req.params.unit_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid unit ID.'));

			return res.send(results[0]);
		});
	});

	/**
	 * Retrieves a list of units from the database.
	 */
	server.get(prefix + '/units', function (req, res, next) {
		connection.query('SELECT * FROM `units`', function (err, results) {
			if (err) return next(err);
			
			return res.send(results);
		});
	});
};