module.exports = function (server, connection, prefix, restify) {
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
	 * Retrieves the attendance log of all students from the database.
	 */
	server.get(prefix + '/attendance', function (req, res, next) {
		connection.query('SELECT * FROM `attendance`', function (err, results) {
			if (err) return next(err);

			if (req.query.populate && req.query.populate == 'session_id') {
				async.each(results, function (attendance, callback) {
					connection.query('SELECT * FROM `sessions` WHERE `session_id` = :session_id', { session_id: attendance.session_id }, function (err, sessions) {
						attendance.session_id = sessions[0];
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
	 * Creates a new attendance record.
	 */
	server.post(prefix + '/attendance', function (req, res, next) {
		connection.query('INSERT INTO `attendance` (`student_id`, `session_id`, `attendance_recorded`) VALUES (:student_id, :session_id, :attendance_recorded)', { student_id: req.params.student_id, session_id: req.params.session_id, attendance_recorded: req.params.attendance_recorded }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

};