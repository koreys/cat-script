const { parse } = require("csv-parse/sync");

function normalizeRow(row) {
  return {
    date: row["Date"] || "",
    description: row["Description"] || "",
    cardMember: row["Card Member"] || "",
    accountNumber: row["Account #"] || "",
    amount: Number(row["Amount"] || 0),
    extendedDetails: row["Extended Details"] || "",
    statementDescription: row["Appears On Your Statement As"] || "",
    address: row["Address"] || "",
    cityState: row["City/State"] || "",
    zipCode: row["Zip Code"] || "",
    country: row["Country"] || "",
    reference: row["Reference"] || "",
    amexCategory: row["Category"] || ""
  };
}

function parseAmexCsv(buffer) {
  const rows = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
    trim: true
  });

  return rows
    .map(normalizeRow)
    .filter(
      row =>
        String(row.description || "").trim().toUpperCase() !==
        "ONLINE PAYMENT - THANK YOU"
    );
}

module.exports = {
  parseAmexCsv,
  normalizeRow
};
