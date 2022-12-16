const express = require("express");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");
const register = require("./controllers/register");
const signin = require("./controllers/signin,js");
const profile = require("./controllers/profile");
const courses = require("./controllers/courses.js");
const planner = require("./controllers/planner.js");
const createlesson = require("./controllers/createlesson.js");
const deletelesson = require("./controllers/deletelesson.js");
const coursecodes = require("./controllers/coursecodes.js");

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

//todo: create express object
const app = express();

//todo: add middleware cors and express.json() to parse the body of the request and make it readable by the server. cors is used to allow cross origin requests. used for development purposes only
app.use(express.json()); // to parse the body of the request
app.use(cors()); // to allow cross origin resource sharing

//todo: /signin -> post = sucess/fail
//! databases are important since if the server gets run again, we lose the data we sent with post since the user variable at the top of the file is reset.
app.post("/signin", (req, res) => { signin.handleSignin(req, res, db, bcrypt)
});

//todo: /register -> post = return user
app.post("/register",(req, res) =>{ register.handleRegister(req, res, db, bcrypt)})

//todo: /profile/:id -> get = user based on id
app.get("/profile/:id", (req, res) => { profile.handleProfileGet(req, res, db)
});

//todo: /courses/:email -> get = courses of curent user via email as filter
app.get("/courses/:email", (req, res) => { courses.handleCoursesGet(req, res, db) });

//todo: get the associated courseplanner rows for the relevant course using id
app.get("/course/lessonplanner/:id", (req, res) => { planner.handlePlannerGet(req, res, db) });

//todo: /createlesson -> post = lesson
app.post("/createlesson", (req, res) => {createlesson.handleCreateLesson(req, res, db)});

//todo: /deletelesson -> delete lesson and return which lessons were deleted as JSPON
app.delete("/deletecourse", (req, res) => {deletelesson.handleDeleteLesson(req, res, db);});

//todo: /modal/courses
app.get("/modal/courses", (req, res) => {coursecodes.handleCourseCodesGet(req, res, db)});

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
  planner.handlePlannerUpdate(req, res, db);
});

//todo: assign a port to the server and cosnole a message if the server is running.

// const PORT = process.env.PORT;
app.listen(6060, () => {
	console.log(`Server is running on port 6060`, new Date());
});

// console.log(PORT);
