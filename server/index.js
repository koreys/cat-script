const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const cors = require("cors");

const db = require("./db");
const { parseAmexCsv } = require("./csvImporter");
const { categorizeTransaction, getRules } = require("./ruleEngine");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/categories", (_req, res) => {
  const categories = db
    .prepare("SELECT * FROM categories ORDER BY sort_order, name")
    .all();

  res.json(categories);
});

app.post("/api/categories", (req, res) => {
  const name = String(req.body.name || "").trim();

  if (!name) {
    return res.status(400).json({ error: "Category name is required." });
  }

  const maxSortOrder = db
    .prepare("SELECT COALESCE(MAX(sort_order), 0) AS value FROM categories")
    .get().value;

  try {
    const result = db
      .prepare("INSERT INTO categories (name, sort_order) VALUES (?, ?)")
      .run(name, maxSortOrder + 1);

    return res.status(201).json(
      db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid)
    );
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.put("/api/categories/:id", (req, res) => {
  const category = db
    .prepare("SELECT * FROM categories WHERE id = ?")
    .get(req.params.id);

  if (!category) {
    return res.status(404).json({ error: "Category not found." });
  }

  const name = String(req.body.name ?? category.name).trim();
  const active =
    req.body.active == null ? category.active : req.body.active ? 1 : 0;

  try {
    db.prepare(
      "UPDATE categories SET name = ?, active = ? WHERE id = ?"
    ).run(name, active, req.params.id);

    return res.json(
      db.prepare("SELECT * FROM categories WHERE id = ?").get(req.params.id)
    );
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get("/api/rules", (_req, res) => {
  const rules = db
    .prepare(
      "SELECT r.*, c.name AS category_name " +
        "FROM rules r JOIN categories c ON c.id = r.category_id " +
        "ORDER BY r.priority, r.id"
    )
    .all()
    .map(rule => ({
      ...rule,
      conditions: JSON.parse(rule.conditions_json || "[]")
    }));

  res.json(rules);
});

app.post("/api/rules", (req, res) => {
  const rule = sanitizeRule(req.body);

  if (rule.error) {
    return res.status(400).json({ error: rule.error });
  }

  const result = db
    .prepare(
      "INSERT INTO rules " +
        "(name, category_id, priority, match_mode, conditions_json, active) " +
        "VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(
      rule.name,
      rule.categoryId,
      rule.priority,
      rule.matchMode,
      JSON.stringify(rule.conditions),
      rule.active ? 1 : 0
    );

  return res.status(201).json({
    id: Number(result.lastInsertRowid)
  });
});

app.put("/api/rules/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM rules WHERE id = ?")
    .get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: "Rule not found." });
  }

  const rule = sanitizeRule(req.body);

  if (rule.error) {
    return res.status(400).json({ error: rule.error });
  }

  db.prepare(
    "UPDATE rules SET " +
      "name = ?, category_id = ?, priority = ?, match_mode = ?, " +
      "conditions_json = ?, active = ? " +
      "WHERE id = ?"
  ).run(
    rule.name,
    rule.categoryId,
    rule.priority,
    rule.matchMode,
    JSON.stringify(rule.conditions),
    rule.active ? 1 : 0,
    req.params.id
  );

  return res.json({ ok: true });
});

app.delete("/api/rules/:id", (req, res) => {
  db.prepare("DELETE FROM rules WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

app.post("/api/import", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Choose an AmEx CSV file." });
  }

  try {
    const rules = getRules();
    const transactions = parseAmexCsv(req.file.buffer).map(
      (transaction, index) => ({
        id: index + 1,
        ...transaction,
        match: categorizeTransaction(transaction, rules)
      })
    );

    const categorized = transactions.filter(transaction => transaction.match)
      .length;

    const total = transactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    return res.json({
      summary: {
        transactions: transactions.length,
        categorized,
        uncategorized: transactions.length - categorized,
        total: Math.round(total * 100) / 100
      },
      transactions
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

function sanitizeRule(body) {
  const name = String(body.name || "").trim();
  const categoryId = Number(body.categoryId);
  const priority = Number(body.priority ?? 100);
  const matchMode = body.matchMode === "any" ? "any" : "all";
  const active = body.active !== false;
  const conditions = Array.isArray(body.conditions)
    ? body.conditions.filter(condition => condition.field && condition.operator)
    : [];

  if (!name) {
    return { error: "Rule name is required." };
  }

  if (
    !categoryId ||
    !db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId)
  ) {
    return { error: "Choose a valid category." };
  }

  if (!conditions.length) {
    return { error: "Add at least one condition." };
  }

  return {
    name,
    categoryId,
    priority,
    matchMode,
    active,
    conditions
  };
}

const clientDist = path.join(__dirname, "..", "client", "dist");

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log("Cat Script web app running at http://localhost:" + PORT);
});
