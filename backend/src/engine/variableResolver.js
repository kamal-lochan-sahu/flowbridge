// Resolves {{variable}} placeholders in config strings
// Supports: {{trigger.name}}, {{trigger.email}}, {{steps.1.output.id}}

const resolveVariables = (config, context = {}) => {
  if (typeof config === "string") return resolveString(config, context);
  if (Array.isArray(config))     return config.map(item => resolveVariables(item, context));
  if (typeof config === "object" && config !== null) {
    const resolved = {};
    for (const [key, value] of Object.entries(config)) {
      resolved[key] = resolveVariables(value, context);
    }
    return resolved;
  }
  return config;
};

const resolveString = (str, context) => {
  return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(context, path.trim());
    return value !== undefined ? String(value) : match;
  });
};

const getNestedValue = (obj, path) => {
  // Supports: trigger.name, trigger.order.id, steps.1.output.email
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
};

// Extract all variables from a config string
const extractVariables = (config) => {
  const vars = new Set();
  const str  = JSON.stringify(config);
  const matches = str.matchAll(/\{\{([^}]+)\}\}/g);
  for (const match of matches) vars.add(match[1].trim());
  return Array.from(vars);
};

module.exports = { resolveVariables, resolveString, getNestedValue, extractVariables };
