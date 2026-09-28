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

app.get("/api/statements/current", (_req, res) => {
  const statement = db
    .prepare("SELECT id FROM statements ORDER BY id DESC LIMIT 1")
    .get();

  if (!statement) {
    return res.status(204).end();
  }

  return res.json(statementResponse(statement.id));
});

app.patch("/api/transactions/bulk", (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
  if (!ids.length) {
    return res.status(400).json({ error: "Choose at least one transaction." });
  }

  const categoryId =
    req.body.manualCategoryId == null ? null : Number(req.body.manualCategoryId);
  const reviewed = req.body.reviewed == null ? null : req.body.reviewed ? 1 : 0;

  if (
    categoryId != null &&
    !db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId)
  ) {
    return res.status(400).json({ error: "Choose a valid category." });
  }

  const setParts = [];
  const values = [];

  if (categoryId !== null) {
    setParts.push("manual_category_id = ?");
    values.push(categoryId);
  }

  if (reviewed !== null) {
    setParts.push("reviewed = ?");
    values.push(reviewed);
  }

  if (!setParts.length) {
    return res.status(400).json({ error: "Nothing to update." });
  }

  const placeholders = ids.map(() => "?").join(",");
  values.push(...ids);

  db.prepare(
    "UPDATE statement_transactions SET " +
      setParts.join(", ") +
      " WHERE id IN (" +
      placeholders +
      ")"
  ).run(...values);

  const statement = db
    .prepare(
      "SELECT statement_id FROM statement_transactions WHERE id = ?"
    )
    .get(ids[0]);

  return res.json(statement ? statementResponse(statement.statement_id) : { ok: true });
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
    const importedTransactions = parseAmexCsv(req.file.buffer).map(transaction => ({
      ...transaction,
      match: categorizeTransaction(transaction, rules)
    }));

    const insertStatement = db.prepare(
      "INSERT INTO statements (filename, status) VALUES (?, 'in_progress')"
    );

    const insertTransaction = db.prepare(
      "INSERT INTO statement_transactions " +
        "(statement_id, position, data_json, match_json, manual_category_id, reviewed) " +
        "VALUES (?, ?, ?, ?, NULL, 0)"
    );

    const statementId = db.transaction(() => {
      const result = insertStatement.run(req.file.originalname || "activity.csv");
      const id = Number(result.lastInsertRowid);

      importedTransactions.forEach((transaction, index) => {
        const { match, ...data } = transaction;
        insertTransaction.run(
          id,
          index,
          JSON.stringify(data),
          match ? JSON.stringify(match) : null
        );
      });

      return id;
    })();

    return res.json(statementResponse(statementId));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});


function statementResponse(statementId) {
  const statement = db
    .prepare("SELECT * FROM statements WHERE id = ?")
    .get(statementId);

  if (!statement) return null;

  const transactions = db
    .prepare(
      "SELECT st.*, c.name AS manual_category_name " +
        "FROM statement_transactions st " +
        "LEFT JOIN categories c ON c.id = st.manual_category_id " +
        "WHERE st.statement_id = ? ORDER BY st.position"
    )
    .all(statementId)
    .map(row => ({
      id: row.id,
      ...JSON.parse(row.data_json),
      match: row.match_json ? JSON.parse(row.match_json) : null,
      manualCategoryId: row.manual_category_id,
      manualCategoryName: row.manual_category_name || null,
      reviewed: !!row.reviewed
    }));

  const categorized = transactions.filter(transaction => transaction.match).length;
  const total = transactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  return {
    statement,
    summary: {
      transactions: transactions.length,
      categorized,
      uncategorized: transactions.filter(transaction => !transaction.match).length,
      total: Math.round(total * 100) / 100
    },
    transactions
  };
}


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

  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log("Cat Script web app running at http://localhost:" + PORT);
});
