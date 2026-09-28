const db = require("./db");

function normalize(value) {
  return String(value ?? "").trim().toUpperCase();
}

function matchesCondition(transaction, condition) {
  const actual = transaction[condition.field];
  const operator = condition.operator;
  const expected = condition.value;

  if (["gt", "gte", "lt", "lte", "eqNumber"].includes(operator)) {
    const a = Number(actual);
    const b = Number(expected);
    if (Number.isNaN(a) || Number.isNaN(b)) return false;
    if (operator === "gt") return a > b;
    if (operator === "gte") return a >= b;
    if (operator === "lt") return a < b;
    if (operator === "lte") return a <= b;
    return a === b;
  }

  const a = normalize(actual);

  if (operator === "equals") return a === normalize(expected);
  if (operator === "contains") return a.includes(normalize(expected));
  if (operator === "startsWith") return a.startsWith(normalize(expected));

  if (operator === "containsAny") {
    const values = Array.isArray(expected)
      ? expected
      : String(expected ?? "").split("\n");
    return values.some(value => value && a.includes(normalize(value)));
  }

  return false;
}

function getRules({ includeInactive = false } = {}) {
  const where = includeInactive ? "" : "WHERE r.active = 1 AND c.active = 1";
  return db.prepare(
    "SELECT r.*, c.name AS category_name " +
    "FROM rules r JOIN categories c ON c.id = r.category_id " +
    where +
    " ORDER BY r.priority ASC, r.id ASC"
  ).all().map(rule => ({
    ...rule,
    conditions: JSON.parse(rule.conditions_json || "[]")
  }));
}

function categorizeTransaction(transaction, rules = getRules()) {
  for (const rule of rules) {
    const results = rule.conditions.map(condition =>
      matchesCondition(transaction, condition)
    );

    const matched =
      rule.match_mode === "any" ? results.some(Boolean) : results.every(Boolean);

    if (matched) {
      return {
        categoryId: rule.category_id,
        categoryName: rule.category_name,
        ruleId: rule.id,
        ruleName: rule.name
      };
    }
  }

  return null;
}

module.exports = {
  getRules,
  categorizeTransaction,
  matchesCondition
};
