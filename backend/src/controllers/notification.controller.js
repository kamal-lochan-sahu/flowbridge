const Notification = require("../models/Notification");
const ApiResponse  = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await Notification.countDocuments({ userId: req.user._id });
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
  return ApiResponse.paginated(res, notifications, {
    total, page: parseInt(page), limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

const markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true }
  );
  return ApiResponse.success(res, null, "Marked as read");
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id }, { isRead: true });
  return ApiResponse.success(res, null, "All marked as read");
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
  return ApiResponse.success(res, { count });
});

module.exports = { getNotifications, markRead, markAllRead, getUnreadCount };
