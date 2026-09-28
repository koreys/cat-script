const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(process.env.CAT_SCRIPT_DB || path.join(dataDir, "cat-script.sqlite"));
db.pragma("journal_mode = WAL");

db.exec(
  "CREATE TABLE IF NOT EXISTS categories (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
    "name TEXT NOT NULL UNIQUE," +
    "active INTEGER NOT NULL DEFAULT 1," +
    "sort_order INTEGER NOT NULL DEFAULT 0" +
  ");" +
  "CREATE TABLE IF NOT EXISTS rules (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
    "name TEXT NOT NULL," +
    "category_id INTEGER NOT NULL," +
    "priority INTEGER NOT NULL DEFAULT 100," +
    "match_mode TEXT NOT NULL DEFAULT 'all'," +
    "conditions_json TEXT NOT NULL DEFAULT '[]'," +
    "active INTEGER NOT NULL DEFAULT 1," +
    "FOREIGN KEY (category_id) REFERENCES categories(id)" +
  ");"
);

const categoryNames = [
  "Korey Gas","Jennifer Gas","Kolton Gas","Dana Gas","Gerry Gas","Irene Gas","EZ-PASS","Travel","Meals",
  "Office Supplies","Mobile Phones","Waste Disposal","Materials-Misc","Office Phones","Medical",
  "Materials-Roofing","Accounting","Dues & Subscriptions","Vehical Maint","Vehical Insurance",
  "Vehical Registration","Advertising","Misc","Credit Card Fees","Internet","Tools & Equipment",
  "Building Maint & Upkeep","Subcontractor-Gutters","Materials-Windows","Materials-Siding",
  "Waste Dump Fees","Skyler Gas","Insurance-Liability"
];

if (db.prepare("SELECT COUNT(*) AS count FROM categories").get().count === 0) {
  const insert = db.prepare("INSERT INTO categories (name, sort_order) VALUES (?, ?)");
  db.transaction(() => categoryNames.forEach((name, i) => insert.run(name, i + 1)))();
}

function categoryId(name) {
  return db.prepare("SELECT id FROM categories WHERE name = ?").get(name)?.id;
}

const peopleGas = [
  ["Korey Gas","KOREY T STANLEY"],
  ["Jennifer Gas","JENNIFER M STANLEY"],
  ["Kolton Gas","KOLTON T STANLEY"],
  ["Dana Gas","DANA B STANLEY"],
  ["Gerry Gas","GERRY K STANLEY"],
  ["Irene Gas","IRENE A STANLEY"],
  ["Skyler Gas","SKYLER K STANLEY"]
];

const ruleSeeds = peopleGas.map(([category, person], i) => ({
  name: category,
  category,
  priority: 10 + i,
  conditions: [
    { field: "cardMember", operator: "equals", value: person },
    { field: "amexCategory", operator: "equals", value: "Transportation-Fuel" },
    { field: "amount", operator: "gt", value: 20 }
  ]
})).concat([
  { name:"EZ-PASS", category:"EZ-PASS", priority:30, conditions:[{field:"description",operator:"containsAny",value:["NEW JERSEY E-Z PASS","NJ EZPASS"]}] },
  { name:"Travel / parking / rideshare", category:"Travel", priority:40, conditions:[{field:"description",operator:"containsAny",value:["UBER","ASBURY PARK PASSPORT","*PARKMOBILE","MPAY2PARK","PAS*PASSPT ASBURY","CITY OF ASBURY PARK","AMERICAN AIRLINES","UNITED AIRLINES"]}] },
  { name:"Vehicle maintenance", category:"Vehical Maint", priority:50, conditions:[{field:"description",operator:"containsAny",value:["CAR WASH","ASBURY CIRCLE WASH","MB AUTO REPAIR"]}] },
  { name:"Home Depot / Lowes small purchases", category:"Materials-Misc", priority:60, conditions:[
    {field:"description",operator:"containsAny",value:["THE HOME DEPOT","HOME DEPOT","LOWES HOME IMPROVEMENT","LOWES","LOWE'S","THE HOME DEPO"]},
    {field:"amount",operator:"lte",value:200}
  ]},
  { name:"Small fuel purchases", category:"Meals", priority:70, conditions:[
    {field:"amexCategory",operator:"equals",value:"Transportation-Fuel"},
    {field:"amount",operator:"lte",value:15}
  ]},
  { name:"Meals merchants", category:"Meals", priority:80, conditions:[{field:"description",operator:"containsAny",value:[
    "CHIPOTLE","EL FAMILIAR","PORTA","PANERA","CRYSTAL DINER","DUNKIN","SMASHBURGER","MCDONALD","BURGER KING",
    "BURGER 25","TACO BELL","WENDY","MAHANA","ROY ROGERS","JERSEY MIKE","SHAKE SHACK","OLIVE GARDEN",
    "BUFFALO WILD","MOE'S","DOMINO","CHILI'S","ANTONIO","NICK'S PIZZA","STARBUCKS","MANHATTAN BAGEL",
    "OUTBACK","SALADWORKS","PLAYA BOWLS","SURF TACO","TACO-TASTIC","FIVE GUYS","KFC","CHICK-FIL-A",
    "GRUBHUB","DOORDASH","BOOSKERDOO","MELLOW MUSHROOM","ROOK COFFEE","BAJA FRESH","PARIS BAGUETTE",
    "DAVES HOT CHICKEN","HABIT EATONTOWN","MILLER S ALE HOUSE","BUBBAKOOS","ON THE BORDER","SUNSET DINER"
  ]}]},
  { name:"7-Eleven under $30", category:"Meals", priority:81, conditions:[{field:"description",operator:"contains",value:"7-ELEVEN"},{field:"amount",operator:"lte",value:30}] },
  { name:"Office supplies / software", category:"Office Supplies", priority:90, conditions:[{field:"description",operator:"containsAny",value:[
    "USPS","STAPLES","ITUNES.COM","HOVER","PIRATE SHIP","VULTR","DIGITALOCEAN","MONGODBCLOUD","GOOGLE*GSUITE",
    "*GSUITE_TWINICC","*BITPORT","MICROSOFT*ULTIMATE","AAA LIFE INSURANCE","RING STANDARD PLAN","MICROSOFT*REALMS"
  ]}]},
  { name:"T-Mobile", category:"Mobile Phones", priority:100, conditions:[{field:"description",operator:"containsAny",value:["T-MOBILE","TMOBILE*AUTO"]}] },
  { name:"Dialpad", category:"Office Phones", priority:110, conditions:[{field:"description",operator:"contains",value:"BT*DIALPAD"}] },
  { name:"Verizon internet", category:"Internet", priority:120, conditions:[{field:"description",operator:"contains",value:"VERIZONRECURRING"}] },
  { name:"Medical", category:"Medical", priority:130, conditions:[{field:"description",operator:"containsAny",value:[
    "TARGET","RITE AID","CVS","HARMON","WALGREENS","ABILITIES IN ACTION","POLLACK HEALTH","FISHBIRD","WORD SLP",
    "DR. KYLE KLI","CARBON HEALTH","UNLOCKING POTENTIAL","OAKHURST DENTAL","WARBY PARKER","BOSONAC ORTHODON",
    "THE ZEN DEN","CAMPI DENTAL","PURE CHIROPRACTIC","SANTO DENTAL","JOEL MANZON DDS","OCEAN CROSSFIT","WODIFY","SPORT CLIPS"
  ]}]},
  { name:"TruGreen", category:"Building Maint & Upkeep", priority:140, conditions:[{field:"description",operator:"contains",value:"TRUGREEN"}] },
  { name:"eBay under $100", category:"Materials-Misc", priority:150, conditions:[{field:"description",operator:"contains",value:"EBAY"},{field:"amount",operator:"lt",value:100}] },
  { name:"Storm Masters", category:"Subcontractor-Gutters", priority:160, conditions:[{field:"description",operator:"contains",value:"STORM MASTERS"}] },
  { name:"Apple under $75", category:"Mobile Phones", priority:170, conditions:[{field:"description",operator:"contains",value:"APPLE.COM"},{field:"amount",operator:"lte",value:75}] },
  { name:"Waste disposal", category:"Waste Disposal", priority:180, conditions:[{field:"description",operator:"containsAny",value:["OCEAN COUNTY LANDFILL","SUBURBAN DISPOS"]}] },
  { name:"Amazon Prime", category:"Office Supplies", priority:185, conditions:[{field:"description",operator:"containsAny",value:["AMAZON PRIME","PRIME VIDEO"]}] },
  { name:"Amazon purchases", category:"Materials-Misc", priority:190, conditions:[{field:"description",operator:"containsAny",value:["AMAZON MARKETPLACE","AMZN MKTP US","AMAZON"]}] },
  { name:"RoofSnap", category:"Materials-Roofing", priority:200, conditions:[{field:"description",operator:"contains",value:"ROOFSNAP"}] },
  { name:"QuickBooks", category:"Accounting", priority:210, conditions:[{field:"description",operator:"contains",value:"INTUIT QUICKBOOKS"}] },
  { name:"Jump Perry", category:"Accounting", priority:211, conditions:[{field:"description",operator:"contains",value:"JUMP PERRY"}] },
  { name:"Subscriptions", category:"Dues & Subscriptions", priority:220, conditions:[{field:"description",operator:"containsAny",value:[
    "SP * RING USA","RING UNLIMITED","LOCASTORG","YOUTUBEPREM","DTV*NFLSUNDAYTICKET","AUDIBLE","BITPORT.IO",
    "ADOBE","DISNEY PLUS","DISNEYPLUS","MOTLEY FOOL","SIRIUS XM","ZOOM","DROPBOX","GRATEFUL DELI","PEACOCK",
    "NODEHUB.IO","*YOUTUBE TV","BETTER BUSINESS BURE","AMAZON WEB SERVICES","MICROSOFT*XBOX LIVE"
  ]}]},
  { name:"AmEx membership fee", category:"Credit Card Fees", priority:230, conditions:[{field:"description",operator:"contains",value:"RENEWAL MEMBERSHIP FEE"}] },
  { name:"Hearth Financing", category:"Credit Card Fees", priority:231, conditions:[{field:"description",operator:"contains",value:"HEARTH FINANCING"}] },
  { name:"Aramark advertising", category:"Advertising", priority:240, conditions:[{field:"description",operator:"containsAny",value:["ARAMARK LINC FIN","ARAMARK LINCOLN","AMK LFF CONCE","ARAMARK LINCO"]}] },
  { name:"Harbor Freight", category:"Tools & Equipment", priority:250, conditions:[{field:"description",operator:"containsAny",value:["HARBOR FREIGHT TOOLS","HARBOR FREIGH"]}] },
  { name:"Agile Premium", category:"Insurance-Liability", priority:260, conditions:[{field:"description",operator:"contains",value:"AGILE PREMIUM"}] }
]);

if (db.prepare("SELECT COUNT(*) AS count FROM rules").get().count === 0) {
  const insert = db.prepare(
    "INSERT INTO rules (name, category_id, priority, match_mode, conditions_json, active) VALUES (?, ?, ?, ?, ?, 1)"
  );
  db.transaction(() => {
    ruleSeeds.forEach(rule => insert.run(
      rule.name,
      categoryId(rule.category),
      rule.priority,
      rule.matchMode || "all",
      JSON.stringify(rule.conditions || [])
    ));
  })();
}

module.exports = db;
