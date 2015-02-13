module.exports = function (server, connection, prefix, restify) {
	// Load module dependencies.
	var async = require('async');

	/**
	 * Creates an attendance record.
	 * POST /attendance
	 */
	server.post(prefix + '/attendance', function (req, res, next) {
		connection.query('INSERT INTO `attendance` (`student_id`, `session_id`, `attendance_recorded`) VALUES (:student_id, :session_id, :attendance_recorded)', { student_id: req.params.student_id, session_id: req.params.session_id, attendance_recorded: req.params.attendance_recorded }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Gets an attendance record.
	 * GET /attendance/{{ ATTENDANCE_ID }}
	 */
	server.get(prefix + '/attendance/:attendance_id', function (req, res, next) {
		connection.query('SELECT * FROM `attendance` WHERE `attendance_id` = :attendance_id', { attendance_id: req.params.attendance_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid attendance ID.'));

			if (req.query.populate && req.query.populate == 'student_id,session_id') {
				async.each(results, function (attendance, callback) {
					connection.query('SELECT * FROM `students` WHERE `student_id` = :student_id', { student_id: attendance.student_id }, function (err, students) {
						attendance.student_id = students[0];
						connection.query('SELECT * FROM `sessions` WHERE `session_id` = :session_id', { session_id: attendance.session_id }, function (err, sessions) {
							attendance.session_id = sessions[0];
							callback();
						});
					});
				}, function () {
					return res.send(results[0]);
				});
			} else {
				return res.send(results[0]);
			}
		});
	});

	/**
	 * Gets the attendance log.
	 * GET /attendance
	 */
	server.get(prefix + '/attendance', function (req, res, next) {
		connection.query('SELECT * FROM `attendance`', function (err, results) {
			if (err) return next(err);

			if (req.query.populate && req.query.populate == 'student_id,session_id') {
				async.each(results, function (attendance, callback) {
					connection.query('SELECT * FROM `students` WHERE `student_id` = :student_id', { student_id: attendance.student_id }, function (err, students) {
						attendance.student_id = students[0];
						connection.query('SELECT * FROM `sessions` WHERE `session_id` = :session_id', { session_id: attendance.session_id }, function (err, sessions) {
							attendance.session_id = sessions[0];
							callback();
						});
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
	 * Updates an attendance record.
	 * PUT /attendance/{{ ATTENDANCE_ID }}
	 */
	server.put(prefix + '/attendance/:attendance_id', function (req, res, next) {
		connection.query('UPDATE `attendance` SET `student_id` = :student_id, `session_id` = :session_id, `attendance_recorded` = :attendance_recorded WHERE `attendance_id` = :attendance_id', { attendance_id: req.params.attendance_id, student_id: req.params.student_id, session_id: req.params.session_id, attendance_recorded: req.params.attendance_recorded }, function (err, results) {
			if (err) return next(err);
			
			return res.send(results);
		});
	});

	/**
	 * Deletes an attendance record.
	 * DELETE /attendance/{{ ATTENDANCE_ID }}
	 */
	server.del(prefix + '/attendance/:attendance_id', function (req, res, next) {
		connection.query('DELETE FROM `attendance` WHERE `attendance_id` = :attendance_id', { attendance_id: req.params.attendance_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});
};