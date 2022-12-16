const handleCreateLesson = (req, res, db) => {
	const { sem, year, courseName, mod, lab, lec, startDate, email } = req.body;
	try {
		if (
			sem.length == 0 ||
			year.length == 0 ||
			courseName.length == 0 ||
			mod.length == 0 ||
			lab.length == 0 ||
			lec.length == 0 ||
			startDate.length == 0 ||
			email.length == 0
		) {
			return res.status(400).json("all fields are required");
		}
	} catch (error) {
		console.log(error);
		res.status(400).json("all fields cannot be empty or undefined");
	}
	db.transaction((trx) => {
		trx
			.insert({
				gradingsem: sem,
				gradingyear: year,
				course: courseName,
				modularity: mod,
				labhrs: lab,
				lechrs: lec,
				date_start: startDate,
				date_initial: new Date(),
				email: email,
			})
			.into("courseslist")
			.returning("*")
      .then((lesson) => {
        if (lesson[0].modularity === "modular") {
					for (let i = 1; i < 7; i++) {
						db.insert({
							ilos: [],
							tlas: [],
							ats: [],
							topics: [],
							remarks: [],
							id: lesson[0].id,
							weeks: i,
							course: lesson[0].course,
							email: lesson[0].email,
						})
							.returning("*")
							.into("courseplanner")
							.catch((err) => {
								console.log(err);
								res.status(400).json("unable to create lesson");
							});
          }
				} else if (lesson[0].modularity === "full") {
					for (let i = 1; i < 19; i++) {
						db.insert({
							ilos: [],
							tlas: [],
							ats: [],
							topics: [],
							remarks: [],
							id: lesson[0].id,
							weeks: i,
							course: lesson[0].course,
							email: lesson[0].email,
						})
							.returning("*")
							.into("courseplanner")
							.catch((err) => {
								console.log(err);
								res.status(400).json("unable to create lesson");
							});
          }
        }
        res.json(lesson[0]);
			})
			.then(trx.commit)
			.catch((err) => trx.rollback);
	}).catch((err) => res.status(400).json("unable to create lesson"));
};

module.exports = {
  handleCreateLesson: handleCreateLesson,
};
