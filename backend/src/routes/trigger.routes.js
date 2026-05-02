const express = require("express");
const router  = express.Router();
const { createTrigger, getTrigger, updateTrigger, testTrigger } = require("../controllers/trigger.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate }     = require("../middleware/validate.middleware");
const { createTriggerSchema, updateTriggerSchema } = require("../validators/workflow.validator");

router.use(authenticate);

router.post("/",          validate(createTriggerSchema), createTrigger);
router.get("/:id",        getTrigger);
router.put("/:id",        validate(updateTriggerSchema), updateTrigger);
router.post("/:id/test",  testTrigger);

module.exports = router;
