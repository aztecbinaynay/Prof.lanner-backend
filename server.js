const express = require("express");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");

//todo: configure knex to connect to postgres database and assign it to the variable db
const db = knex({
	client: "pg",
	connection: {
		host: "127.0.0.1", //localhost
		user: "postgres", //add your user name for the database here
		port: 5432, // add your port number here
		password: "50239812", //add your correct password in here
		database: "lessonplannerserver", //add your database name you created here
	},
});

// db.select("*")
// 	.from("users")
// 	.then((data) => console.log(data));

//todo: create express object
const app = express();

//todo: add middleware cors and express.json() to parse the body of the request and make it readable by the server. cors is used to allow cross origin requests. used for development purposes only
app.use(express.json()); // to parse the body of the request
app.use(cors()); // to allow cross origin resource sharing

//todo: display the user table in route
//! for debugging purposes ONLY !!, do not include in production
app.get("/", (req, res) => {
	db.select("*")
		.from("users")
		.then((data) => {
			res.json(data);
		});
});

//todo: display the courses table in route
//! for debugging purposes ONLY !!, do not include in production
app.get("/courses", (req, res) => {
	db.select("*")
		.from("courseslist")
		.then((data) => {
			res.json(data);
		});
});

//todo: /signin -> post = sucess/fail
//! databases are important since if the server gets run again, we lose the data we sent with post since the user variable at the top of the file is reset.
app.post("/signin", (req, res) => {
	db.select("email", "hash")
		.from("login")
		.where("email", "=", req.body.email)
		.then((loginDetails) => {
			const isValid = bcrypt.compareSync(
				req.body.password,
				loginDetails[0].hash
			);
			if (isValid) {
				return (
					db
						.select("*")
						//use return when using database within a databas
						.from("users")
						.where("email", "=", req.body.email)
						.then((user) => {
							res.json(user[0]);
						})
						.catch((err) => res.status(400).json("unable to get user"))
				);
			} else {
				res.status(400).json("wrong credentials");
			}
		})
		.catch((err) => res.status(400).json("wrong credentials"));
});

//todo: /register -> post = return user
app.post("/register", (req, res) => {
	const { email, name, password } = req.body;
	if (email.length == 0 || password.length == 0 || name.length == 0) {
		return res
			.status(400)
			.json("your username or password or name or al three are empty");
	}
	const hash = bcrypt.hashSync(password);
	db.transaction((trx) => {
		trx
			.insert({
				hash: hash,
				email: email,
			})
			.into("login")
			.returning("email")
			.then((loginEmail) => {
				return trx("users")
					.returning("*") //returning the user
					.insert({
						email: loginEmail[0].email, //returns an array of objects: [{email: "email"}]
						name: name,
						joined: new Date(),
					})
					.then((user) => {
						res.json(user[0]); // use indexing because user is stored in a list
					})
					.catch((err) => res.status(400).json("unable to register"));
			})
			.then(trx.commit)
			.catch(trx.rollback);
	}).catch((err) => res.status(400).json("unable to register"));
});

//todo: /profile/:id -> get = user based on id
app.get("/profile/:id", (req, res) => {
	const { id } = req.params;

	db.select("*")
		.from("users")
		.where({ id })
		.then((user) => {
			if (user.length) {
				res.json(user[0]);
			} else {
				res.status(400).json("not found");
			}
		});
	// cannot use .catch() here to catch any errors because the .then() returns an empty array even when no user is present. It doesn't actually throw any error.
});

//todo: /courses/:email -> get = courses of curent user via email as filter
app.get("/courses/:email", (req, res) => {
	const { email } = req.params;

	db.select("*")
		.from("courseslist")
		.where({ email })
		.then((courses) => {
			res.json(courses);
		});
	// cannot use .catch() here to catch any errors because the .then() returns an empty array even when no user is present. It doesn't actually throw any error.
});

//todo: get the associated courseplanner rows for the relevant course using id
app.get("/course/lessonplanner/:id", (req, res) => {
  const { id } = req.params;
  // console.log(id);
  db.select("weeks", "ilos", "tlas", "ats", "topics", "remarks")
    .from("courseplanner")
    .where({id})
		.then((data) => {
			res.json(data);
		});
});

//todo: /createlesson -> post = lesson
app.post("/createlesson", (req, res) => {
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
});

//todo: /deletelesson -> delete lesson and return which lessons were deleted as JSPON
app.delete("/deletecourse", (req, res) => {
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
});

//todo: /modal/courses
app.get("/modal/courses", (req, res) => {
	db.select("*")
		.from("coursescodes")
		.then((courses) => {
			res.json(courses);
		});
});

//todo: /image -> put -> user
//? expected input
// {
//     "textArr": ["hi", "hello"],
//     "typeInput": "ilos", //! "ilos" or "tlas" or "ats" or "topics" or "remarks"
//     "id":87, //! id of the course
//     "mode":"delete", //! "delete" or "add" //? maye not be implemented
//     "weeks":1
// }
//?
app.put("/course/lessonplanner/update", (req, res) => {
  const { textArr, typeInput, id, weeks } = req.body;
  console.log(textArr, typeInput, id, weeks)
  db("courseplanner")
		.where("id",'=', id)
		.andWhere("weeks", "=", weeks)
    .update({
      [typeInput]: textArr,
    })
		.returning([typeInput, 'weeks']) //return the score of the user into the database
    .then((score) => {
      console.log(score);
			// catch error this way because .then() returns an empty array even when no user is present. It doesn't actually throw any error.
			if (score.length) {
				res.status(200).json(score[0]);
			} else {
				res.status(400).json("incorrect information");
			}
		}) //use indexing because score is stored in a list; return to the font end. Following error is when the database itself is non-existent or disconnected
    .catch((err) => {
      console.log(err);
      res.status(400).json("could not update")
    });
});

//todo: assign a port to the server and cosnole a message if the server is running.

app.listen(6060, () => {
	console.log("Server is running on port 6060", new Date());
});

//! Backup!
// //todo: /createlesson -> post = lesson
// app.post("/createlesson", (req, res) => {
// 	const { sem, year, courseName, mod, lab, lec, startDate, email } = req.body;
// 	try {
// 		if (
// 			sem.length == 0 ||
// 			year.length == 0 ||
// 			courseName.length == 0 ||
// 			mod.length == 0 ||
// 			lab.length == 0 ||
// 			lec.length == 0 ||
// 			startDate.length == 0 ||
// 			email.length == 0
// 		) {
// 			return res.status(400).json("all fields are required");
// 		}
//   } catch (error) {
//     console.log(error)
//     res.status(400).json("all fields cannot be empty or undefined");
//   }
// 	db.transaction((trx) => {
// 		trx
// 			.insert({
// 				gradingsem: sem,
// 				gradingyear: year,
// 				course: courseName,
// 				modularity: mod,
// 				labhrs: lab,
// 				lechrs: lec,
// 				date_start: startDate,
// 				date_initial: new Date(),
// 				email: email,
// 			})
// 			.into("courseslist")
// 			.returning("*")
// 			.then((lesson) => {
// 				res.json(lesson[0]);
// 			})
// 			.then(trx.commit)
// 			.catch((err) => trx.rollback);
// 	}).catch((err) => res.status(400).json("unable to create lesson"));
// });


//-------------
// //todo: /createlesson -> post = lesson
// app.post("/createlesson", (req, res) => {
// 	const { sem, year, courseName, mod, lab, lec, startDate, email } = req.body;
// 	try {
// 		if (
// 			sem.length == 0 ||
// 			year.length == 0 ||
// 			courseName.length == 0 ||
// 			mod.length == 0 ||
// 			lab.length == 0 ||
// 			lec.length == 0 ||
// 			startDate.length == 0 ||
// 			email.length == 0
// 		) {
// 			return res.status(400).json("all fields are required");
// 		}
// 	} catch (error) {
// 		console.log(error);
// 		res.status(400).json("all fields cannot be empty or undefined");
// 	}
// 	db.transaction((trx) => {
// 		trx
// 			.insert({
// 				gradingsem: sem,
// 				gradingyear: year,
// 				course: courseName,
// 				modularity: mod,
// 				labhrs: lab,
// 				lechrs: lec,
// 				date_start: startDate,
// 				date_initial: new Date(),
// 				email: email,
// 			})
// 			.into("courseslist")
// 			.returning("*")
// 			.then((lesson) => {
//         if (lesson[0].modularity === "modular") {
//           const datas = [];
// 					for (let i = 1; i < 7; i++) {
// 						return trx("courseplanner")
// 							.returning("*")
// 							.insert({
// 								ilos: [],
// 								tlas: [],
// 								ats: [],
// 								topics: [],
// 								remarks: [],
// 								id: lesson[0].id,
// 								weeks: i,
// 								course: lesson[0].course,
// 								email: lesson[0].email,
// 							})
//               .then((data) => {
//                 console.log(data);
// 								datas.push(data);
// 							})
// 							.catch((err) => {
// 								console.log(err);
// 								res.status(400).json("unable to create lesson");
// 							});
//           }
//           res.status(200).json(datas);
// 				} else if (lesson[0].modularity === "full") {
// 					const datas = [];
// 					for (let i = 1; i < 19; i++) {
// 						return trx("courseplanner")
// 							.returning("*")
// 							.insert({
// 								ilos: [],
// 								tlas: [],
// 								ats: [],
// 								topics: [],
// 								remarks: [],
// 								id: lesson[0].id,
// 								weeks: i,
// 								course: lesson[0].course,
// 								email: lesson[0].email,
// 							})
//               .then((data) => {
//                 console.log(data);
// 								datas.push(data);
// 							})
// 							.catch((err) => {
// 								console.log(err);
// 								res.status(400).json("unable to create lesson");
// 							});
// 					}
// 					res.status(200).json(datas);
//         }
//         res.status(400).json("unable to create lesson");
// 			})
// 			.then(trx.commit)
// 			.catch((err) => trx.rollback);
// 	}).catch((err) => res.status(400).json("unable to create lesson"));
// });


//--- previous delete
// app.delete("/deletecourse", (req, res) => {
// 	const { id, email } = req.body;
// 	try {
// 		if (id.length === 0) {
// 			return res.status(400).json("no courses selected");
// 		}
// 	} catch (error) {
// 		console.log(error);
// 		res.status(400).json("no courses selected");
// 	}
// 	db.transaction((trx) => {
// 		trx
// 			.delete()
// 			.from("courseslist")
// 			.whereIn("id", id)
// 			.andWhere("email", email)
// 			.returning("course")
// 			.then((lesson) => {
// 				if (lesson.length) {
// 					const deletedCourses = lesson.map((course) => course.course);
// 					const courses = { courses: deletedCourses };
// 					res.status(200).json(courses);
// 				} else {
// 					res.status(400).json("not found");
// 				}
// 			})
// 			.then(trx.commit)
// 			.catch((err) => trx.rollback);
// 	}).catch((err) => res.status(400).json("unable to delete lesson"));
// });
//--- previous delete

//--------previious put/update method---
// app.put("/course/lessonplanner/update", (req, res) => {
// 	const { text, typeInput, id, mode, weeks } = req.body;
// 	db("courseplanner")
// 		.whereIn("id", id)
// 		.andWhere("weeks", "=", weeks)
// 		.where("id", "=", id) //find the user with the id
// 		.update("score", 1) //increment the score by 1
// 		.returning("score") //return the score of the user into the database
// 		.then((score) => {
// 			// catch error this way because .then() returns an empty array even when no user is present. It doesn't actually throw any error.
// 			if (score.length) {
// 				res.json(score[0]);
// 			} else {
// 				res.status(400).json("user has no score");
// 			}
// 		}) //use indexing because score is stored in a list; return to the font end. Following error is when the database itself is non-existent or disconnected
// 		.catch((err) => res.status(400).json("connection failed"));
// });
//--------previious put/update method---
