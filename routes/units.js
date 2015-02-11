module.exports = function (server, connection, prefix, restify) {
	/**
	 * Gets a unit's students.
	 * GET /units/{{ UNIT_ID }}/students
	 */
	server.get(prefix + '/units/:unit_id/students', function (req, res, next) {
		connection.query('SELECT `students`.* FROM `studentsessions` INNER JOIN `sessions` ON `studentsessions`.`session_id` = `sessions`.`session_id` INNER JOIN `students` ON `studentsessions`.`student_id` = `students`.`student_id` WHERE `sessions`.`unit_id` = :unit_id GROUP BY `students`.`student_id`', { unit_id: req.params.unit_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Gets a unit's sessions.
	 * GET /units/{{ UNIT_ID }}/sessions
	 */
	server.get(prefix + '/units/:unit_id/sessions', function (req, res, next) {
		connection.query('SELECT * FROM `sessions` WHERE `unit_id` = :unit_id', { unit_id: req.params.unit_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Creates a unit.
	 * POST /units
	 */
	server.post(prefix + '/units', function (req, res, next) {
		connection.query('INSERT INTO `units` (`unit_title`, `unit_code`) VALUES (:unit_title, :unit_code)', { unit_title: req.params.unit_title, unit_code: req.params.unit_code }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Gets a unit.
	 * GET /units/{{ UNIT_ID }}
	 */
	server.get(prefix + '/units/:unit_id', function (req, res, next) {
		connection.query('SELECT * FROM `units` WHERE `unit_id` = :unit_id', { unit_id: req.params.unit_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid unit ID.'));

			return res.send(results[0]);
		});
	});

	/**
	 * Gets a list of units.
	 * GET /units
	 */
	server.get(prefix + '/units', function (req, res, next) {
		connection.query('SELECT * FROM `units`', function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Updates a unit.
	 * PUT /units/{{ UNIT_ID }}
	 */
	server.put(prefix + '/units/:unit_id', function (req, res, next) {
		connection.query('UPDATE `units` SET `unit_title` = :unit_title, `unit_code` = :unit_code WHERE `unit_id` = :unit_id', { unit_id: req.params.unit_id, unit_title: req.params.unit_title, unit_code: req.params.unit_code }, function (err, results) {
			if (err) return next(err);
			
			return res.send(results);
		});
	});

	/**
	 * Deletes a unit.
	 * DELETE /units/{{ UNIT_ID }}
	 */
	server.del(prefix + '/units/:unit_id', function (req, res, next) {
		connection.query('DELETE FROM `units` WHERE `unit_id` = :unit_id', { unit_id: req.params.unit_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});
};