let catagories = require('./catagories')
let activityList = require('./store').activityList
let autoCatAmt = require('./store').autoCatAmt
let store = require('./store')
const money = require("money-math")

let test = function(data,x) {

    //Rules - Move out to seperate file at some point
    ///////
    /////// GAS ///////////
    if (data.name == "KOREY T STANLEY" && data.amexCat == "Transportation-Fuel" && +data.amt > 20){
        let index = catagories.findIndex(i => i.catName == "Korey Gas")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        console.log(`Test Matched! autoCatamt is: ${autoCatAmt} and data.amt is ${data.amt}`)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.name == "JENNIFER M STANLEY" && data.amexCat == "Transportation-Fuel" && +data.amt > 20){
        let index = catagories.findIndex(i => i.catName == "Jennifer Gas")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.name == "KOLTON T STANLEY" && data.amexCat == "Transportation-Fuel" && +data.amt > 20){
        let index = catagories.findIndex(i => i.catName == "Kolton Gas")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.name == "DANA B STANLEY" && data.amexCat == "Transportation-Fuel" && +data.amt > 20){
        let index = catagories.findIndex(i => i.catName == "Dana Gas")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.name == "IRENE A STANLEY" && data.amexCat == "Transportation-Fuel" && +data.amt > 20){
        let index = catagories.findIndex(i => i.catName == "Irene Gas")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.name == "GERRY K STANLEY" && data.amexCat == "Transportation-Fuel" && +data.amt > 20){
        let index = catagories.findIndex(i => i.catName == "Gerry Gas")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }

    ///////
    /////// Other Vehical ///////////
    if (data.desc.includes("NEW JERSEY E-Z PASS") ||
        data.desc.includes("NJ EZPASS")) {
        let index = catagories.findIndex(i => i.catName == "EZ-PASS")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("UBER") || 
        data.desc.includes("ASBURY PARK PASSPORT") || 
        data.desc.includes("*PARKMOBILE") || 
        data.desc.includes("MPAY2PARK") || 
        data.desc.includes("PAS*PASSPT ASBURY")) {
        let index = catagories.findIndex(i => i.catName == "Travel")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("CAR WASH") || 
        data.desc.includes("Car Wash") ||
        data.desc.includes("MB AUTO REPAIR") && +data.amt <= 400) {
        let index = catagories.findIndex(i => i.catName == "Vehical Maint")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    /////////
    ///////// Materials ///////
    if (data.desc.includes("The Home Depot") || data.desc.includes("Lowes Home Improvement") && +data.amt <= 200) {
        let index = catagories.findIndex(i => i.catName == "Materials-Misc")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if 
    (data.desc.includes("HOME DEPOT") || 
        data.desc.includes("LOWES") ||
        data.desc.includes("THE HOME DEPO") ||
        data.desc.includes("LOWE'S") && +data.amt <= 200) {
        let index = catagories.findIndex(i => i.catName == "Materials-Misc")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }

    /////// 
    /////// FOOD | Meals ///////
    if (data.amexCat == "Transportation-Fuel" && +data.amt <= 15){
        let index = catagories.findIndex(i => i.catName == "Meals")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("WAWA FUEL/CONVENIENCE") && +data.amt <= 15){
        let index = catagories.findIndex(i => i.catName == "Meals")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("WAWA STORE") && +data.amt <= 15){
        let index = catagories.findIndex(i => i.catName == "Meals")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("Chipotle") || 
        data.desc.includes("CHIPOTLE") || 
        data.desc.includes("EL FAMILIAR") ||
        data.desc.includes("PORTA") || 
        data.desc.includes("Panera Bread") || 
        data.desc.includes("PANERA BREAD") || 
        data.desc.includes("PANERA WALL TOWNSHIP") ||
        data.desc.includes("CRYSTAL DINER") || 
        data.desc.includes("Dunkin' Donuts") || 
        data.desc.includes("DUNKIN") ||
        data.desc.includes("BJ'S REATAURANTS") || 
        data.desc.includes("SMASHBURGER") || 
        data.desc.includes("McDonald's") ||
        data.desc.includes("MCDONALD'S") || 
        data.desc.includes("MCDONALDS") || 
        data.desc.includes("Burger King") ||
        data.desc.includes("BURGER 25") ||
        data.desc.includes("Taco Bell") || 
        data.desc.includes("TACO BELL") || 
        data.desc.includes("WENDY'S") ||
        data.desc.includes("MAHANA") ||
        data.desc.includes("ROY ROGERS") ||
        data.desc.includes("JERSEY MIKE") || 
        data.desc.includes("Jersey Mike") ||
        data.desc.includes("BJ'S REST 615") ||
        data.desc.includes("Wendy's") || 
        data.desc.includes("SHAKE SHACK") || 
        data.desc.includes("Shake Shack") || 
        data.desc.includes("Olive Garden") ||
        data.desc.includes("OLIVE GARDEN") ||
        data.desc.includes("BUFFALO WILD WINGS") || 
        data.desc.includes("MOE'S SW GRILL") ||
        data.desc.includes("MOES SW GRILL") ||
        data.desc.includes("Domino's Pizza") || 
        data.desc.includes("Chili's Grill") ||
        data.desc.includes("CHILI'S 0651") ||
        data.desc.includes("ANTONIOS GOURMET") ||
        data.desc.includes("ANTONIO'S GOURMET") ||
        data.desc.includes("NICK'S PIZZA") ||
        data.desc.includes("Starbucks") ||
        data.desc.includes("STARBUCKS") ||
        data.desc.includes("MANHATTAN BAGEL") ||
        data.desc.includes("OUTBACK STEAKHOUSE") || 
        data.desc.includes("SALADWORKS") ||
        data.desc.includes("PLAYA BOWLS") ||
        data.desc.includes("SURF TACO") ||
        data.desc.includes("SURF TAC") ||
        data.desc.includes("KFC") ||
        data.desc.includes("Chick-fil-A") ||
        data.desc.includes("CHICK-FIL-A") ||
        data.desc.includes("BOSTON MARKET") ||
        data.desc.includes("GRUBHUB*") ||
        data.desc.includes("DOORDASH*") ||
        data.desc.includes("*DOORDASH") ||
        data.desc.includes("DOORDASH DASHPASS") ||
        data.desc.includes("BOOSKERDOO COFFEE") ||
        data.desc.includes("TST* BOOSKERDOO") ||
        data.desc.includes("MELLOW MUSHROOM") ||
        data.desc.includes("ROOK COFFEE") ||
        data.desc.includes("MAHANA FRESH") ||
        data.desc.includes("BAJA FRESH") ||
        data.desc.includes("PARIS BAGUETTE") ||
        data.desc.includes("DAVES HOT CHICKEN") ||
        data.desc.includes("HABIT EATONTOWN") ||
        data.desc.includes("BUFFALO WILD WNGS") ||
        data.desc.includes("MILLER S ALE HOUSE") ||
        data.desc.includes("BUBBAKOOS") ||
        data.desc.includes("ON THE BORDER") ||
        data.desc.includes("SUNSET DINER") ) {
        let index = catagories.findIndex(i => i.catName == "Meals")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("7-ELEVEN") && +data.amt <= 30) {
        let index = catagories.findIndex(i => i.catName == "Meals")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true
        return 
    }

    ///////
    //////// Ofiice Supplies ////////
    if (data.desc.includes("USPS") || data.desc.includes("STAPLES") || data.desc.includes("ITUNES.COM") || data.desc.includes("HOVER")) {
        let index = catagories.findIndex(i => i.catName == "Office Supplies")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("VULTR HOLDINGS") ||
        data.desc.includes("VULTR") || 
        data.desc.includes("DIGITALOCEAN.COM") || 
        data.desc.includes("Hover.com") || 
        data.desc.includes("MONGODBCLOUD") || 
        data.desc.includes("GOOGLE*GSUITE") || 
        data.desc.includes("*GSUITE_TWINICC") ||
        data.desc.includes("*BITPORT") ||
        data.desc.includes("MICROSOFT*ULTIMATE") ||
        data.desc.includes("MICROSOFT*REALMS")) {
        let index = catagories.findIndex(i => i.catName == "Office Supplies")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }

    ///////
    //////// Travel /////////
    if (data.desc.includes("City of Asbury Park")) {
        let index = catagories.findIndex(i => i.catName == "Travel")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("AMERICAN AIRLINES")) {
        let index = catagories.findIndex(i => i.catName == "Travel")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }

    ///////
    //////// Utilities /////////
    if (data.desc.includes("T-MOBILE") || data.desc.includes("TMOBILE*AUTO")) {
        let index = catagories.findIndex(i => i.catName == "Mobile Phones")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("BT*DIALPAD")) {
        let index = catagories.findIndex(i => i.catName == "Office Phones")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true
        return
    }
    if (data.desc.includes("VERIZONRECURRING")) {
        let index = catagories.findIndex(i => i.catName == "Internet")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }

    ///////
    /////// Medical //////
    if (data.desc.includes("Target") || 
        data.desc.includes("RITE AID") || 
        data.desc.includes("CVS") ||
        data.desc.includes("HARMON DISCOUNT") ||  
        data.desc.includes("HARMONSTORE") || 
        data.desc.includes("WALGREENS") || 
        data.desc.includes("Walmart") && +data.amt <= 50 )  {
        let index = catagories.findIndex(i => i.catName == "Medical")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("ABILITIES IN ACTION") || 
        data.desc.includes("POLLACK HEALTH") ||
        data.desc.includes("FISHBIRD") ||
        data.desc.includes("WORD SLP, LLC") ||
        data.desc.includes("DR. KYLE KLI") ||
        data.desc.includes("CARBON HEALTH") ||
        data.desc.includes("UNLOCKING POTENTIAL") ||
        data.desc.includes("OAKHURST DENTAL") ||
        data.desc.includes("WARBY PARKER") ||
        data.desc.includes("Bosonac Orthodon") ||
        data.desc.includes("JOEL MANZON DDS") ) {
        let index = catagories.findIndex(i => i.catName == "Medical")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    
    if (data.desc.includes("OCEAN CROSSFIT")) {
        let index = catagories.findIndex(i => i.catName == "Medical")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("WODIFY PAY") ||
        data.desc.includes("WODIFY") ) {
        let index = catagories.findIndex(i => i.catName == "Medical")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("SPORT CLIPS")) {
        let index = catagories.findIndex(i => i.catName == "Medical")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    ///////
    /////// Others ////////
    if (data.desc.includes("TRUGREEN")) {
        let index = catagories.findIndex(i => i.catName == "Building Maint & Upkeep")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }

    if (data.desc.includes("EBAY") && +data.amt < 100){
        let index = catagories.findIndex(i => i.catName == "Materials-Misc")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        console.log(`Test Matched! autoCatamt is: ${autoCatAmt} and data.amt is ${data.amt}`)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }

    if (data.desc.includes("STORM MASTERS")) {
        let index = catagories.findIndex(i => i.catName == "Subcontractor-Gutters")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }

    if (data.desc.includes("APPLE.COM") && +data.amt <= 75) {
        let index = catagories.findIndex(i => i.catName == "Mobile Phones")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }

    if (data.desc.includes("OCEAN COUNTY LANDFILL")) {
        let index = catagories.findIndex(i => i.catName == "Waste Disposal")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }

    if (data.desc.includes("Amazon Marketplace") ||
        data.desc.includes("AMAZON") ||
        data.desc.includes("AMERICAN WATER") || 
        data.desc.includes("AMER WATER RESOUNAPERVILLE") ||
        data.desc.includes("AMZN MKTP US")) {
        let index = catagories.findIndex(i => i.catName == "Materials-Misc")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("Amazon Prime") || data.desc.includes("PRIME VIDEO")) {
        let index = catagories.findIndex(i => i.catName == "Office Supplies")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("ROOFSNAP") ) {
        let index = catagories.findIndex(i => i.catName == "Materials-Roofing")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("INTUIT QUICKBOOKS") ) {
        let index = catagories.findIndex(i => i.catName == "Accounting")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("JUMP PERRY") ) {
        let index = catagories.findIndex(i => i.catName == "Accounting")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("SP * RING USA") || 
        data.desc.includes("RING UNLIMITED") ||
        data.desc.includes("LOCASTORG") || 
        data.desc.includes("YOUTUBEPREM") ||
        data.desc.includes("DTV*NFLSUNDAYTICKET") || 
        data.desc.includes("Audible") || 
        data.desc.includes("AUDIBLE") || 
        data.desc.includes("BITPORT.IO") || 
        data.desc.includes("ADOBE *PHOTOGPHY") || 
        data.desc.includes("ADOBE PHOTOGPHY") ||
        data.desc.includes("DISNEY PLUS") ||
        data.desc.includes("DISNEYPLUS") || 
        data.desc.includes("MOTLEY FOOL") || 
        data.desc.includes("SIRIUS XM") || 
        data.desc.includes("ZOOM.US") ||
        data.desc.includes("ZOOM MEETING") || 
        data.desc.includes("DROPBOX") || 
        data.desc.includes("GRATEFUL DELI") ||
        data.desc.includes("PEACOCK") ||
        data.desc.includes("NODEHUB.IO") ||
        data.desc.includes("*YOUTUBE TV") ||
        data.desc.includes("Amazon Web Services") ||
        data.desc.includes("MICROSOFT*XBOX LIVE") ) {
        let index = catagories.findIndex(i => i.catName == "Dues & Subscriptions")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("RENEWAL MEMBERSHIP FEE") ) {
        let index = catagories.findIndex(i => i.catName == "Credit Card Fees")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("HEARTH FINANCING") ) {
        let index = catagories.findIndex(i => i.catName == "Credit Card Fees")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("ARAMARK LINC FIN") || 
        data.desc.includes("ARAMARK LINCOLN") ||
        data.desc.includes("AMK LFF CONCE") ||
        data.desc.includes("ARAMARK LINCO") ) {
        let index = catagories.findIndex(i => i.catName == "Advertising")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("Harbor Freight Tools") || data.desc.includes("HARBOR FREIGHT") ) {
        let index = catagories.findIndex(i => i.catName == "Tools & Equipment")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
}

module.exports = test