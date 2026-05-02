// Evaluates filter/condition actions
// Operators: equals, not_equals, contains, greater_than, less_than, exists, not_exists

const { getNestedValue } = require("./variableResolver");

const evaluateCondition = (config, context = {}) => {
  const { field, operator, value, onFalse = "stop" } = config;

  // Get actual field value
  const fieldPath    = field?.replace(/\{\{(.+?)\}\}/, "$1").trim();
  const actualValue  = getNestedValue(context, fieldPath) ?? field;

  let result = false;

  switch (operator) {
    case "equals":       result = String(actualValue) === String(value); break;
    case "not_equals":   result = String(actualValue) !== String(value); break;
    case "contains":     result = String(actualValue).toLowerCase().includes(String(value).toLowerCase()); break;
    case "not_contains": result = !String(actualValue).toLowerCase().includes(String(value).toLowerCase()); break;
    case "greater_than": result = parseFloat(actualValue) > parseFloat(value); break;
    case "less_than":    result = parseFloat(actualValue) < parseFloat(value); break;
    case "greater_equal":result = parseFloat(actualValue) >= parseFloat(value); break;
    case "less_equal":   result = parseFloat(actualValue) <= parseFloat(value); break;
    case "exists":       result = actualValue !== undefined && actualValue !== null && actualValue !== ""; break;
    case "not_exists":   result = actualValue === undefined || actualValue === null || actualValue === ""; break;
    case "starts_with":  result = String(actualValue).startsWith(String(value)); break;
    case "ends_with":    result = String(actualValue).endsWith(String(value)); break;
    default:             result = false;
  }

  console.log(`🔍 Condition: ${fieldPath} ${operator} ${value} → ${result}`);
  return result;
};

module.exports = { evaluateCondition };
