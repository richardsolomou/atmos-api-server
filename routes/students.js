module.exports = function (server, mysql_conn, prefix) {
	/**
	 * Retrieves the attendance log of a specific student from the database.
	 */
	server.get(prefix + '/students/:student_id/attendance', function (req, res) {
		mysql_conn.query('SELECT * FROM `students` WHERE `student_id` = :student_id', { student_id: req.params.student_id }, function (err, results) {
			if (err) return res.send(err);
			if (!results || !results.length) {
				err = new Error('Invalid student ID.');
				err.status = 404;
				return res.send(err);
			}

			mysql_conn.query('SELECT `session_id`, `attendance_recorded` FROM `attendance` WHERE `student_id` = :student_id', { student_id: req.params.student_id }, function (err, results) {
				if (err) return res.send(err);

				return res.send(results);
			});
		});
	});

	/**
	 * Retrieves a specific student from the database.
	 */
	server.get(prefix + '/students/:student_id', function (req, res) {
		mysql_conn.query('SELECT * FROM `students` WHERE `student_id` = :student_id', { student_id: req.params.student_id }, function (err, results) {
			if (err) return res.send(err);
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
			if (err) return res.send(err);

			return res.send(results);
		});
	});
};