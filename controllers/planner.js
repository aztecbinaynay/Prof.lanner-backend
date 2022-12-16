const handlePlannerGet = (req, res, db) => {
  const { id } = req.params;
  // console.log(id);
  db.select("weeks", "ilos", "tlas", "ats", "topics", "remarks")
    .from("courseplanner")
    .where({ id })
    .orderBy("weeks", "asc")
		.then((data) => {
			res.json(data);
		});
};

const handlePlannerUpdate = (req, res, db) => {
  const { textArr, typeInput, id, weeks } = req.body;
  console.log(textArr, typeInput, id, weeks)
  db("courseplanner")
		.where("id",'=', id)
		.andWhere("weeks", "=", weeks)
    .update({
      [typeInput]: textArr,
    })
		.returning([typeInput, 'weeks']) 
    .then((score) => {
      console.log(score);
		
			if (score.length) {
				res.status(200).json(score[0]);
			} else {
				res.status(400).json("incorrect information");
			}
		}) 
    .catch((err) => {
      console.log(err);
      res.status(400).json("could not update")
    });
};

module.exports = {
  handlePlannerGet: handlePlannerGet,
  handlePlannerUpdate: handlePlannerUpdate,
};
