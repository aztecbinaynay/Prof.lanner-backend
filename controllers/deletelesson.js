const handleDeleteLesson = (req, res, db) => {
	const { id, email } = req.body;
	try {
		if (id.length === 0) {
			return res.status(400).json("no courses selected");
		}
	} catch (error) {
		console.log(error);
		res.status(400).json("no courses selected");
	}
	db.transaction((trx) => {
		trx
			.delete()
			.from("courseslist")
			.whereIn("id", id)
			.andWhere("email", email)
			.returning("course")
			.then((lesson) => {
				trx("courseplanner")
					.delete()
					.from("courseplanner")
					.whereIn("id", id)
					.andWhere("email", email)
					.returning("*")
					.catch((err) => {
						console.log(err);
						res.status(400).json("unable to delete lesson");
					});
				if (lesson.length) {
					const deletedCourses = lesson.map((course) => course.course);
					const courses = { courses: deletedCourses };
					res.status(200).json(courses);
				} else {
					res.status(400).json("not found");
				}
			})
			.then(trx.commit)
			.catch((err) => trx.rollback);
	}).catch((err) => res.status(400).json("unable to delete lesson"));
};

module.exports = {
	handleDeleteLesson: handleDeleteLesson,
};
