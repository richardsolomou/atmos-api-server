module.exports = function (server, mysql_conn, prefix, restify) {
	/**
	 * Retrieves the attendance log of a specific student from the database.
	 */
	server.get(prefix + '/students/:student_id/attendance', function (req, res, next) {
		mysql_conn.query('SELECT * FROM `students` WHERE `student_id` = :student_id', { student_id: req.params.student_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid student ID.'));

			mysql_conn.query('SELECT `session_id`, `attendance_recorded` FROM `attendance` WHERE `student_id` = :student_id', { student_id: req.params.student_id }, function (err, results) {
				if (err) return res.send(err);

				return res.send(results);
			});
		});
	});

	/**
	 * Retrieves a specific student from the database.
	 */
	server.get(prefix + '/students/:student_id', function (req, res, next) {
		mysql_conn.query('SELECT * FROM `students` WHERE `student_id` = :student_id', { student_id: req.params.student_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid student ID.'));

			return res.send(results[0]);
		});
	});

	/**
	 * Retrieves a list of students from the database.
	 */
	server.get(prefix + '/students', function (req, res, next) {
		mysql_conn.query('SELECT * FROM `students`', function (err, results) {
			if (err) return next(err);
			
			return res.send(results);
		});
	});
};