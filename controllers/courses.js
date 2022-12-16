const handleCoursesGet = (req, res, db) => {
	const { email } = req.params;

	db.select("*")
		.from("courseslist")
		.where({ email })
		.then((courses) => {
			res.json(courses);
		});
	// cannot use .catch() here to catch any errors because the .then() returns an empty array even when no user is present. It doesn't actually throw any error.
};

module.exports = {
  handleCoursesGet: handleCoursesGet,
};
