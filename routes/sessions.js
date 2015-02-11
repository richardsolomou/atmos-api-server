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
	 * Retrieves the students of a specific session from the database.
	 */
	server.get(prefix + '/sessions/:session_id/students', function (req, res, next) {
		connection.query('SELECT * FROM `sessions` WHERE `session_id` = :session_id', { session_id: req.params.session_id }, function (err, results) {
			if (err) return next(err);
			if (!results || !results.length) return next(new restify.errors.NotFoundError('Invalid session ID.'));

			connection.query('SELECT `students`.* FROM `studentsessions` INNER JOIN `students` ON `studentsessions`.`student_id` = `students`.`student_id` INNER JOIN `sessions` ON `studentsessions`.`session_id` = `sessions`.`session_id` WHERE `studentsessions`.`session_id` = :session_id GROUP BY `students`.`student_id`', { session_id: req.params.session_id }, function (err, results) {
				if (err) return next(err);

				return res.send(results);
			});
		});
	});

	/**
	 * Creates a new alternative session for another session.
	 */
	server.post(prefix + '/sessions/alternatives', function (req, res, next) {
		connection.query('INSERT INTO `alternativesessions` (`primary_session_id`, `secondary_session_id`) VALUES (:primary_session_id, :secondary_session_id)', { primary_session_id: req.params.primary_session_id, secondary_session_id: req.params.secondary_session_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Retrieves the alternative sessions of a specific session from the database.
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
	 * Retrieves the alternative sessions of a specific session from the database.
	 */
	server.get(prefix + '/sessions/:session_id/alternatives/available', function (req, res, next) {
		connection.query('SELECT * FROM `sessions` WHERE `session_id` = :session_id', { session_id: req.params.session_id }, function (err, session) {
			if (err) return next(err);
			if (!session || !session.length) return next(new restify.errors.NotFoundError('Invalid session ID.'));

			connection.query('SELECT `available`.* FROM `sessions` AS `session` INNER JOIN `sessions` AS `available` ON `available`.`unit_id` = `session`.`unit_id` WHERE `session`.`session_id` = :session_id AND `available`.`session_id` != :session_id AND (DATE_SUB(DATE(`available`.`session_from`), INTERVAL +1 WEEK) <= DATE(`session`.`session_from`) OR DATE_SUB(DATE(`available`.`session_from`), INTERVAL -1 WEEK) <= DATE(`session`.`session_from`))', { session_id: req.params.session_id }, function (err, results) {
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
	});	

	/**
	 * Removes a session from being an alternative session for another session.
	 */
	server.del(prefix + '/sessions/alternatives/:alternativesession_id', function (req, res, next) {
		connection.query('DELETE FROM `alternativesessions` WHERE `alternativesession_id` = :alternativesession_id', { alternativesession_id: req.params.alternativesession_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Creates a new session.
	 */
	server.post(prefix + '/sessions', function (req, res, next) {
		connection.query('INSERT INTO `sessions` (`session_name`, `unit_id`, `session_room`, `session_from`, `session_to`) VALUES (:session_name, :unit_id, :session_room, :session_from, :session_to)', { session_name: req.params.session_name, unit_id: req.params.unit_id, session_room: req.params.session_room, session_from: req.params.session_from, session_to: req.params.session_to }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});

	/**
	 * Retrieves a specific session from the database.
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
	 * Retrieves a list of sessions from the database.
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
	 * Updates a specific session.
	 */
	server.put(prefix + '/sessions/:session_id', function (req, res, next) {
		connection.query('UPDATE `sessions` SET `session_name` = :session_name, `unit_id` = :unit_id, `session_room` = :session_room, `session_from` = :session_from, `session_to` = :session_to WHERE `session_id` = :session_id', { session_id: req.params.session_id, session_name: req.params.session_name, unit_id: req.params.unit_id, session_room: req.params.session_room, session_from: req.params.session_from, session_to: req.params.session_to }, function (err, results) {
			if (err) return next(err);
			
			return res.send(results);
		});
	});

	/**
	 * Deletes a specific session.
	 */
	server.del(prefix + '/sessions/:session_id', function (req, res, next) {
		connection.query('DELETE FROM `sessions` WHERE `session_id` = :session_id', { session_id: req.params.session_id }, function (err, results) {
			if (err) return next(err);

			return res.send(results);
		});
	});
};