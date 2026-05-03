const express = require("express");
const router  = express.Router();
const { getNotifications, markRead, markAllRead, getUnreadCount } = require("../controllers/notification.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/",            getNotifications);
router.get("/unread-count",getUnreadCount);
router.put("/read-all",    markAllRead);
router.put("/:id/read",    markRead);

module.exports = router;
