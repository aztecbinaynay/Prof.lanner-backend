const handleRegister = (req, res, db, bcrypt) => {
	const { email, name, password } = req.body;
	if (email.length == 0 || password.length == 0 || name.length == 0) {
		return res
			.status(400)
			.json("your username or password or name or all three are empty");
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
};

module.exports = {
  handleRegister: handleRegister
}
