const express = require("express");
const router  = express.Router();
const {
  createAction, getWorkflowActions, updateAction,
  deleteAction, reorderActions, testAction, getActionTemplates,
} = require("../controllers/action.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate }     = require("../middleware/validate.middleware");
const { createActionSchema, updateActionSchema, reorderActionsSchema } = require("../validators/action.validator");

router.use(authenticate);

router.get("/templates",          getActionTemplates);
router.post("/",                  validate(createActionSchema),   createAction);
router.get("/workflow/:id",       getWorkflowActions);
router.put("/reorder",            validate(reorderActionsSchema), reorderActions);
router.put("/:id",                validate(updateActionSchema),   updateAction);
router.delete("/:id",             deleteAction);
router.post("/:id/test",          testAction);

module.exports = router;
