module.exports = function (server, connection, prefix, restify) {
	// Load module dependencies.
	var async = require('async');

	/**
	 * Gets a session's students.
	 * GET /sessions/{{ SESSION_ID }}/students
	 */
	server.get(prefix + '/sessions/:session_id/students', function (req, res, next) {
		connection.query('SELECT `students`.* FROM `studentsessions` INNER JOIN `students` ON `studentsessions`.`student_id` = `students`.`student_id` INNER JOIN `sessions` ON `studentsessions`.`session_id` = `sessions`.`session_id` WHERE `studentsessions`.`session_id` = :session_id GROUP BY `students`.`student_id`', { session_id: req.params.session_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Sets an alternative session for a session.
	 * POST /sessions/alternatives
	 */
	server.post(prefix + '/sessions/alternatives', function (req, res, next) {
		connection.query('INSERT INTO `alternativesessions` (`primary_session_id`, `secondary_session_id`) VALUES (:primary_session_id, :secondary_session_id)', { primary_session_id: req.params.primary_session_id, secondary_session_id: req.params.secondary_session_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Gets the existing alternative sessions of a session.
	 * GET /sessions/{{ SESSION_ID }}/alternatives
	 */
	server.get(prefix + '/sessions/:session_id/alternatives', function (req, res, next) {
		connection.query('SELECT * FROM `sessions` WHERE `session_id` = :session_id', { session_id: req.params.session_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid session ID.'));

			connection.query('SELECT `sessions`.*, `alternativesessions`.`alternativesession_id` FROM `alternativesessions` INNER JOIN `sessions` ON `alternativesessions`.`secondary_session_id` = `sessions`.`session_id` WHERE `alternativesessions`.`primary_session_id` = :session_id UNION SELECT `sessions`.*, `alternativesessions`.`alternativesession_id` FROM `alternativesessions` INNER JOIN `sessions` ON `alternativesessions`.`primary_session_id` = `sessions`.`session_id` WHERE `alternativesessions`.`secondary_session_id` = :session_id', { session_id: req.params.session_id }, function (err, results) {
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
	});

	/**
	 * Gets the available alternative sessions of a session.
	 * GET /sessions/{{ SESSION_ID }}/alternatives/available
	 */
	server.get(prefix + '/sessions/:session_id/alternatives/available', function (req, res, next) {
		connection.query('SELECT `available`.* FROM `sessions` AS `session` INNER JOIN `sessions` AS `available` ON `available`.`unit_id` = `session`.`unit_id` WHERE `session`.`session_id` = :session_id AND `available`.`session_id` != :session_id AND DATE_SUB(DATE(`available`.`session_from`), INTERVAL +1 WEEK) <= DATE(`session`.`session_from`) AND DATE_SUB(DATE(`available`.`session_from`), INTERVAL -1 WEEK) >= DATE(`session`.`session_from`)', { session_id: req.params.session_id }, function (err, results) {
			if (err) return next(err);

			connection.query('SELECT `sessions`.*, `alternativesessions`.`alternativesession_id` FROM `alternativesessions` INNER JOIN `sessions` ON `alternativesessions`.`secondary_session_id` = `sessions`.`session_id` WHERE `alternativesessions`.`primary_session_id` = :session_id UNION SELECT `sessions`.*, `alternativesessions`.`alternativesession_id` FROM `alternativesessions` INNER JOIN `sessions` ON `alternativesessions`.`primary_session_id` = `sessions`.`session_id` WHERE `alternativesessions`.`secondary_session_id` = :session_id', { session_id: req.params.session_id }, function (err, alternatives) {
				if (err) return next(err);

				for (var i = 0; i < results.length; i++) {
					for (var j = 0; j < alternatives.length; j++) {
						if (results[i].session_id == alternatives[j].session_id) {
							results.splice(i, 1);
						}
					}
				}

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
	});	

	/**
	 * Unsets an alternative session.
	 * DELETE /sessions/alternatives/{{ ALTERNATIVESESSION_ID }}
	 */
	server.del(prefix + '/sessions/alternatives/:alternativesession_id', function (req, res, next) {
		connection.query('DELETE FROM `alternativesessions` WHERE `alternativesession_id` = :alternativesession_id', { alternativesession_id: req.params.alternativesession_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Creates a session.
	 * POST /sessions
	 */
	server.post(prefix + '/sessions', function (req, res, next) {
		connection.query('INSERT INTO `sessions` (`session_name`, `unit_id`, `session_room`, `session_from`, `session_to`) VALUES (:session_name, :unit_id, :session_room, :session_from, :session_to)', { session_name: req.params.session_name, unit_id: req.params.unit_id, session_room: req.params.session_room, session_from: req.params.session_from, session_to: req.params.session_to }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Gets a session.
	 * GET /sessions/{{ SESSION_ID }}
	 */
	server.get(prefix + '/sessions/:session_id', function (req, res, next) {
		connection.query('SELECT * FROM `sessions` WHERE `session_id` = :session_id', { session_id: req.params.session_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid session ID.'));

			if (req.query.populate && req.query.populate == 'unit_id') {
				connection.query('SELECT * FROM `units` WHERE `unit_id` = :unit_id', { unit_id: results[0].unit_id }, function (err, units) {
					results[0].unit_id = units[0];
					return res.send(results[0]);
				});
			} else {
				return res.send(results[0]);
			}
		});
	});

	/**
	 * Gets a list of sessions.
	 * GET /sessions
	 */
	server.get(prefix + '/sessions', function (req, res, next) {
		connection.query('SELECT * FROM `sessions`', function (err, results) {
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
	 * Updates a session.
	 * PUT /sessions/{{ SESSION_ID }}
	 */
	server.put(prefix + '/sessions/:session_id', function (req, res, next) {
		connection.query('UPDATE `sessions` SET `session_name` = :session_name, `unit_id` = :unit_id, `session_room` = :session_room, `session_from` = :session_from, `session_to` = :session_to WHERE `session_id` = :session_id', { session_id: req.params.session_id, session_name: req.params.session_name, unit_id: req.params.unit_id, session_room: req.params.session_room, session_from: req.params.session_from, session_to: req.params.session_to }, function (err, results) {
			if (err) return next(err);
			
			return res.send(results);
		});
	});

	/**
	 * Deletes a session.
	 * DELETE /sessions/{{ SESSION_ID }}
	 */
	server.del(prefix + '/sessions/:session_id', function (req, res, next) {
		connection.query('DELETE FROM `sessions` WHERE `session_id` = :session_id', { session_id: req.params.session_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});
};