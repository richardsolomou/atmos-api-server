module.exports = function (server, connection, prefix, restify) {
	// Load module dependencies.
	var async = require('async');

	/**
	 * Gets a student's units.
	 * GET /students/{{ STUDENT_ID }}/units
	 */
	server.get(prefix + '/students/:student_id/units', function (req, res, next) {
		connection.query('SELECT `units`.* FROM `studentsessions` INNER JOIN `sessions` ON `studentsessions`.`session_id` = `sessions`.`session_id` INNER JOIN `units` ON `units`.`unit_id` = `sessions`.`unit_id` WHERE `studentsessions`.`student_id` = :student_id GROUP BY `units`.`unit_id`', { student_id: req.params.student_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Gets a student's sessions.
	 * GET /students/{{ STUDENT_ID }}/sessions
	 */
	server.get(prefix + '/students/:student_id/sessions', function (req, res, next) {
		connection.query('SELECT `sessions`.* FROM `studentsessions` INNER JOIN `sessions` ON `studentsessions`.`session_id` = `sessions`.`session_id` WHERE `studentsessions`.`student_id` = :student_id', { student_id: req.params.student_id }, function (err, results) {
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
	 * Creates a student.
	 * POST /students
	 */
	server.post(prefix + '/students', function (req, res, next) {
		connection.query('INSERT INTO `students` (`student_id`, `student_name`, `student_card`) VALUES (:student_id, :student_name, :student_card)', { student_id: req.params.student_id, student_name: req.params.student_name, student_card: req.params.student_card }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Gets a student by their student card.
	 * GET /students/student_card/{{ STUDENT_CARD }}
	 */
	server.get(prefix + '/students/student_card/:student_card', function (req, res, next) {
		connection.query('SELECT * FROM `students` WHERE `student_card` = :student_card', { student_card: req.params.student_card }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid student card.'));

			return res.send(results[0]);
		});
	});

	/**
	 * Gets a student.
	 * GET /students/{{ STUDENT_ID }}
	 */
	server.get(prefix + '/students/:student_id', function (req, res, next) {
		connection.query('SELECT * FROM `students` WHERE `student_id` = :student_id', { student_id: req.params.student_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid student ID.'));

			return res.send(results[0]);
		});
	});

	/**
	 * Gets a list of students.
	 * GET /students
	 */
	server.get(prefix + '/students', function (req, res, next) {
		connection.query('SELECT * FROM `students`', function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Updates a student.
	 * PUT /students/{{ STUDENT_ID }}
	 */
	server.put(prefix + '/students/:student_id', function (req, res, next) {
		connection.query('UPDATE `students` SET `student_name` = :student_name, `student_card` = :student_card WHERE `student_id` = :student_id', { student_id: req.params.student_id, student_name: req.params.student_name, student_card: req.params.student_card }, function (err, results) {
			if (err) return next(err);
			
			return res.send(results);
		});
	});

	/**
	 * Deletes a student.
	 * DELETE /students/{{ STUDENT_ID }}
	 */
	server.del(prefix + '/students/:student_id', function (req, res, next) {
		connection.query('DELETE FROM `students` WHERE `student_id` = :student_id', { student_id: req.params.student_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});
};