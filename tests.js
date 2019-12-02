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
    if (data.desc.includes("NEW JERSEY E-Z PASS")) {
        let index = catagories.findIndex(i => i.catName == "EZ-PASS")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("UBER") || data.desc.includes("ASBURY PARK PASSPORT")) {
        let index = catagories.findIndex(i => i.catName == "Travel")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("CAR WASH") || data.desc.includes("Car Wash")) {
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
    (data.desc.includes("HOME DEPOT") || data.desc.includes("LOWES OF MANCHESTER") && +data.amt <= 200) {
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
        data.desc.includes("EL FAMILIAR") ||
        data.desc.includes("PORTA") || 
        data.desc.includes("Panera Bread") || 
        data.desc.includes("PANERA WALL TOWNSHIP") ||
        data.desc.includes("Dunkin' Donuts") || 
        data.desc.includes("SMASHBURGER") || 
        data.desc.includes("McDonald's") || 
        data.desc.includes("JERSEY MIKE") || 
        data.desc.includes("Jersey Mike") ||
        data.desc.includes("BJ'S REST 615") ||
        data.desc.includes("Wendy's") || 
        data.desc.includes("SHAKE SHACK") || 
        data.desc.includes("Shake Shack") || 
        data.desc.includes("Olive Garden") ||
        data.desc.includes("BUFFALO WILD WINGS") || 
        data.desc.includes("MOE'S SW GRILL") ||
        data.desc.includes("Domino's Pizza") || 
        data.desc.includes("Chili's Grill") ||
        data.desc.includes("Starbucks") ||
        data.desc.includes("BOOSKERDOO COFFEE") ||
        data.desc.includes("SUNSET DINER") ) {
        let index = catagories.findIndex(i => i.catName == "Meals")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("7-ELEVEN") && +data.amt <= 30) {
        let index = catagories.findIndex(i => i.catName == "Office Supplies")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true
        return 
    }

    ///////
    //////// Ofiice Supplies ////////
    if (data.desc.includes("USPS") || data.desc.includes("STAPLES") || data.desc.includes("ITUNES.COM")) {
        let index = catagories.findIndex(i => i.catName == "Office Supplies")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    if (data.desc.includes("VULTR HOLDINGS") || data.desc.includes("DIGITALOCEAN.COM") ) {
        let index = catagories.findIndex(i => i.catName == "Office Supplies")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }

    ///////
    //////// Utilities /////////
    if (data.desc.includes("T-MOBILE")) {
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
    if (data.desc.includes("SPORT CLIPS")) {
        let index = catagories.findIndex(i => i.catName == "Medical")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
    ///////
    /////// Others ////////
    if (data.desc.includes("APPLE.COM/BILL") && +data.amt <= 100) {
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
        data.desc.includes("AMZN MKTP US")) {
        let index = catagories.findIndex(i => i.catName == "Materials-Misc")
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
    if (data.desc.includes("SP * RING USA") || 
        data.desc.includes("YOUTUBEPREM") ||
        data.desc.includes("DTV*NFLSUNDAYTICKET") || 
        data.desc.includes("Audible") || 
        data.desc.includes("BITPORT.IO") || 
        data.desc.includes("ADOBE *PHOTOGPHY") || 
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
    if (data.desc.includes("ARAMARK LINC FIN") ) {
        let index = catagories.findIndex(i => i.catName == "Advertising")
        catagories[index].amount = money.add(catagories[index].amount, data.amt)
        store.autoCatAmt = money.add(store.autoCatAmt, data.amt)
        activityList[x].catComplete = true 
        return
    }
}

module.exports = test