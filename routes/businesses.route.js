const express = require("express");
const { businessesController } = require("../controllers");

const businessesRouter = express.Router();

businessesRouter.route("/businesses").post(businessesController.createBusiness);
businessesRouter.post("/businesses/:id/flow", businessesController.updateBusinessFlow)
businessesRouter.post("/businesses/:id/instructions", businessesController.updateBusinessInstructions);

module.exports = businessesRouter;