const express = require("express");
const router  = express.Router();
const { getTemplates, getTemplate, useTemplate } = require("../controllers/template.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);
router.get("/",           getTemplates);
router.get("/:id",        getTemplate);
router.post("/:id/use",   useTemplate);

module.exports = router;
