const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const PDFDocument = require("pdfkit");

const db = require("./db");
const { parseAmexCsv } = require("./csvImporter");
const { categorizeTransaction, getRules } = require("./ruleEngine");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const DEFAULT_PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/statements", (_req, res) => {
  const statements = db
    .prepare("SELECT * FROM statements ORDER BY id DESC")
    .all()
    .map(statement => {
      const report = statementResponse(statement.id);
      const needReview = report.transactions.filter(
        transaction =>
          !transaction.match &&
          !(transaction.manualCategoryId && transaction.reviewed)
      ).length;

      return {
        ...statement,
        transactions: report.summary.transactions,
        total: report.summary.total,
        needReview,
        completed: needReview === 0
      };
    });

  res.json(statements);
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

app.get("/api/statements/:id", (req, res) => {
  const report = statementResponse(Number(req.params.id));

  if (!report) {
    return res.status(404).json({ error: "Statement not found." });
  }

  return res.json(report);
});

app.get("/api/statements/:id/export.csv", (req, res) => {
  const report = statementResponse(Number(req.params.id));
  if (!report) {
    return res.status(404).json({ error: "Statement not found." });
  }

  if (!statementIsComplete(report.transactions)) {
    return res.status(409).json({ error: "Finish reviewing the statement before exporting." });
  }

  const rows = [
    [
      "Date",
      "Description",
      "Card Member",
      "Amount",
      "AmEx Category",
      "Final Category",
      "Categorized By",
      "Reviewed"
    ]
  ];

  for (const transaction of report.transactions) {
    const finalCategory =
      transaction.match?.categoryName ||
      transaction.manualCategoryName ||
      "";

    const categorizedBy = transaction.match
      ? "Rule: " + transaction.match.ruleName
      : "Manual";

    rows.push([
      transaction.date,
      transaction.description,
      transaction.cardMember,
      Number(transaction.amount || 0).toFixed(2),
      transaction.amexCategory,
      finalCategory,
      categorizedBy,
      transaction.match ? "Auto" : transaction.reviewed ? "Yes" : "No"
    ]);
  }

  const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n");
  const baseName = safeBaseName(report.statement.filename);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="' + baseName + '-categorized.csv"'
  );
  return res.send("\uFEFF" + csv);
});

app.get("/api/statements/:id/report.pdf", (req, res) => {
  const report = statementResponse(Number(req.params.id));
  if (!report) {
    return res.status(404).json({ error: "Statement not found." });
  }

  if (!statementIsComplete(report.transactions)) {
    return res.status(409).json({ error: "Finish reviewing the statement before exporting." });
  }

  const totals = categorySummary(report.transactions);
  const baseName = safeBaseName(report.statement.filename);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="' + baseName + '-category-report.pdf"'
  );

  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 54, right: 54, bottom: 54, left: 54 }
  });

  doc.pipe(res);

  const logoBuffer = getTwinLogoBuffer();

  if (logoBuffer) {
    doc.image(logoBuffer, 54, 44, { fit: [72, 72] });
  }

  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#111111")
    .text("American Express Categorization Report", 140, 57, { width: 400 });

  doc.fontSize(10).font("Helvetica").fillColor("#555555");
  doc.text("Twin Building Inc.", 140, 86, { width: 400 });
  doc.text("Source: " + report.statement.filename, 140, 101, { width: 400 });
  doc.text(
    "Imported: " +
      new Date(report.statement.imported_at + "Z").toLocaleString("en-US"),
    140,
    116,
    { width: 400 }
  );

  doc.x = 54;
  doc.y = 145;

  doc.fillColor("#111111").fontSize(12).font("Helvetica-Bold");
  doc.text("Statement Summary");
  doc.moveDown(0.45);

  doc.font("Helvetica").fontSize(10);
  doc.text("Transactions: " + report.summary.transactions);
  doc.text("Statement total: " + formatMoney(report.summary.total));
  doc.moveDown(1);

  const startX = doc.page.margins.left;
  const widths = [260, 90, 120];
  let y = doc.y;

  drawPdfRow(doc, y, startX, widths, ["Category", "Transactions", "Amount"], true);
  y += 24;

  for (const item of totals) {
    if (y > 700) {
      doc.addPage();
      y = doc.page.margins.top;
      drawPdfRow(doc, y, startX, widths, ["Category", "Transactions", "Amount"], true);
      y += 24;
    }

    drawPdfRow(
      doc,
      y,
      startX,
      widths,
      [item.category, String(item.count), formatMoney(item.amount)],
      false
    );
    y += 22;
  }

  y += 8;
  doc.moveTo(startX, y).lineTo(startX + widths.reduce((a, b) => a + b, 0), y).strokeColor("#999999").stroke();
  y += 10;
  doc.font("Helvetica-Bold").fillColor("#111111");
  doc.text("Grand Total", startX, y, { width: widths[0] });
  doc.text(String(report.summary.transactions), startX + widths[0], y, { width: widths[1], align: "right" });
  doc.text(formatMoney(report.summary.total), startX + widths[0] + widths[1], y, { width: widths[2], align: "right" });

  doc.end();
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

  if (statement) {
    updateStatementStatus(statement.statement_id);
    return res.json(statementResponse(statement.statement_id));
  }

  return res.json({ ok: true });
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



function statementIsComplete(transactions) {
  return transactions.every(
    transaction => transaction.match || (transaction.manualCategoryId && transaction.reviewed)
  );
}

function updateStatementStatus(statementId) {
  const report = statementResponse(statementId);
  if (!report) return;

  const status = statementIsComplete(report.transactions)
    ? "completed"
    : "in_progress";

  db.prepare("UPDATE statements SET status = ? WHERE id = ?").run(
    status,
    statementId
  );
}

function finalCategoryName(transaction) {
  return (
    transaction.match?.categoryName ||
    transaction.manualCategoryName ||
    ""
  );
}

function categorySummary(transactions) {
  const totals = new Map();

  for (const transaction of transactions) {
    const category = finalCategoryName(transaction);
    if (!category) continue;

    const current = totals.get(category) || {
      category,
      count: 0,
      amount: 0
    };

    current.count += 1;
    current.amount += Number(transaction.amount || 0);
    totals.set(category, current);
  }

  return [...totals.values()].sort((a, b) =>
    a.category.localeCompare(b.category)
  );
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\\r\\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function safeBaseName(filename) {
  return String(filename || "activity")
    .replace(/\\.csv$/i, "")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "activity";
}

function getTwinLogoBuffer() {
  try {
    const logoPath = path.join(
      __dirname,
      "..",
      "client",
      "public",
      "twin-logo.png"
    );
    return fs.readFileSync(logoPath);
  } catch (_error) {
    return null;
  }
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(value || 0));
}

function drawPdfRow(doc, y, startX, widths, values, header) {
  let x = startX;

  if (header) {
    doc
      .rect(startX, y - 5, widths.reduce((a, b) => a + b, 0), 22)
      .fill("#F3F4F6");
  }

  doc
    .fillColor("#111111")
    .font(header ? "Helvetica-Bold" : "Helvetica")
    .fontSize(9);

  values.forEach((value, index) => {
    doc.text(String(value), x + 4, y, {
      width: widths[index] - 8,
      align: index === 0 ? "left" : "right",
      ellipsis: true
    });
    x += widths[index];
  });
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

function startServer(port = DEFAULT_PORT) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, "127.0.0.1", () => {
      const address = server.address();
      const actualPort =
        typeof address === "object" && address ? address.port : port;

      console.log(
        "Cat Script web app running at http://127.0.0.1:" + actualPort
      );

      resolve({ server, port: actualPort });
    });

    server.once("error", reject);
  });
}

if (require.main === module) {
  startServer().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
