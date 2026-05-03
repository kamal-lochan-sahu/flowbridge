const WorkflowTemplate = require("../models/WorkflowTemplate");
const Workflow         = require("../models/Workflow");
const ApiError         = require("../utils/ApiError");
const ApiResponse      = require("../utils/ApiResponse");
const asyncHandler     = require("../utils/asyncHandler");

const getTemplates = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  const templates = await WorkflowTemplate.find(filter).sort({ usageCount: -1 });
  return ApiResponse.success(res, { templates });
});

const getTemplate = asyncHandler(async (req, res) => {
  const template = await WorkflowTemplate.findById(req.params.id);
  if (!template) throw ApiError.notFound("Template not found");
  return ApiResponse.success(res, { template });
});

const useTemplate = asyncHandler(async (req, res) => {
  const template = await WorkflowTemplate.findById(req.params.id);
  if (!template) throw ApiError.notFound("Template not found");

  const workflow = await Workflow.create({
    userId:       req.user._id,
    name:         req.body.name || template.name,
    description:  template.description,
    status:       "draft",
    fromTemplate: template._id,
    tags:         [template.category],
  });

  template.usageCount++;
  await template.save();

  return ApiResponse.created(res, { workflow }, "Workflow created from template");
});

module.exports = { getTemplates, getTemplate, useTemplate };
