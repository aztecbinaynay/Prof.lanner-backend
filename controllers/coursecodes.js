const handleCourseCodesGet = (req, res, db) => {
	db.select("*")
		.from("coursescodes")
		.then((courses) => {
			res.json(courses);
		});
};

module.exports = {
  handleCourseCodesGet: handleCourseCodesGet,
};
