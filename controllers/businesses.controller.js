const { Business } = require("../models");

const createBusiness = async (req, res) => {
  if (await Business.exists({ businessWaid: req.body.businessWaid })) {
    return res.status(400).send({ error: "Business already exists" });
  }
  const business = await Business.create(req.body);
  res.status(201).send(business);
};

const updateBusinessFlow = async (req, res) => {
  const id = req.params.id;
  const { flow } = req.body;
  const business = await Business.findById(id);
  business.flow = flow;
  await business.save();

  res.send(business);
};

const updateBusinessInstructions = async (req, res) => {
  const id = req.params.id;
  const { instructions } = req.body;
  const business = await Business.findById(id);
  business.instructions = instructions;
  await business.save();

  res.send(business);
};

module.exports = {
  createBusiness,
  updateBusinessFlow,
  updateBusinessInstructions,
};
