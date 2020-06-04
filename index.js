#!/usr/bin/env node

const program = require('commander')
const csv = require('csv')
const fs = require('fs')
const chalk = require('chalk')
const clear = require('clear')
//const money = require('money-math')
//const Dinero = require('dinero.js')
const currency = require('currency.js')
let Table = require('cli-table3')
const inquirer = require('inquirer')
const pdf = require('html-pdf')
const ProgressBar = require('progress')

const test = require('./tests')
let catagories = require('./catagories')
let activityList = require('./store').activityList
let store = require('./store')
let totalAmt = require('./store').totalAmt


program
    .version('0.1')
    .option('-c, --cat [pathToFile]', 'catagorize the contents of CSV file at path given')
    .option('-t, --total [pathToFile]', 'grand total the expenses in the CSV file at path given')
    .parse(process.argv)

//Start total function
if(program.total) {

    let totalsList = []
    //let totalAmt = "0"
    let koreyAmt = "0"
    let koltonAmt = "0"
    let gerryAmt = "0"
    let jenAmt = "0"
    let danaAmt = "0"
    let ireneAmt = "0"

    let parse = csv.parse
    let stream = fs.createReadStream(program.total)
        .pipe(parse({ delimiter: ',', columns: null }))
    
    stream
        .on("error", err => { return console.error(err.message) })
        .on('data', data => {
            let desc = data[1]
            let name = data[2]
            let amt = data[4]
            if(desc != "ONLINE PAYMENT - THANK YOU") {
                totalsList.push({ 'amt': amt, 'desc': desc, 'name': name })
            }
            
        })
        .on("end", () => {
            totalsList.shift() //remove the first item from array which in this case is coloumn names
            console.log(`A total of ${chalk.green(totalsList.length)} expenses found.`)
            //console.log(totalsList)
            totalsList.forEach(line => { 
                //console.log(`Current totalAmt is: ${totalAmt} and the lines amt is ${line.amt}`)
                totalAmt = currency(totalAmt).add(line.amt)  
                //totalAmt = Dinero({ amount: totalAmt }).add(Dinero({ amount: line.amt }))
                if (line.name == "KOREY T STANLEY") {
                    //koreyAmt = money.add(koreyAmt, line.amt)
                    koreyAmt = currency(koreyAmt).add(line.amt)
                }
                if (line.name == "KOLTON T STANLEY") {
                    koltonAmt = currency(koltonAmt).add(line.amt)
                }
                if (line.name == "GERRY K STANLEY") {
                    gerryAmt = currency(gerryAmt).add(line.amt)
                    //gerryAmt = Dinero({ amount: gerryAmt }).add(Dinero({ amount: line.amt }))
                }
                if (line.name == "JENNIFER M STANLEY") {
                    jenAmt = currency(jenAmt).add(line.amt)
                    //jenAmt = Dinero({ amount: jenAmt }).add(Dinero({ amount: line.amt }))
                }
                if (line.name == "DANA B STANLEY") {
                    danaAmt = currency(danaAmt).add(line.amt)
                    //danaAmt = Dinero({ amount: danaAmt }).add(Dinero({ amount: line.amt }))
                }
                if (line.name == "IRENE A STANLEY") {
                    ireneAmt = currency(ireneAmt).add(line.amt)
                    //ireneAmt = Dinero({ amount: ireneAmt }).add(Dinero({ amount: line.amt }))
                }
            })
            console.log(`The total amount of parsed expenses is ${chalk.blue(totalAmt)}`)

            // outout total to a table
            let totalsTable = new Table({
                head: ['Name', 'Amount'], 
                style: {
                    'padding-top' : 0,
                    'padding-bottom' : 0
                    //head: [],    //disable colors in header cells
                    //border: []  //disable colors for the border
                },
                colWidths: [20, 10]  //set the widths of each column (optional)
            })
            totalsTable.push(['Korey', koreyAmt.toString()])
            totalsTable.push(['Kolton', koltonAmt.toString()])
            totalsTable.push(['Gerry', gerryAmt.toString()])
            totalsTable.push(['Jennifer', jenAmt.toString()])
            totalsTable.push(['Dana', danaAmt.toString()])
            totalsTable.push(['Irene', ireneAmt.toString()])
            totalsTable.push(['Total', totalAmt.toString()])
            
            console.log(totalsTable.toString())
            // End output command line table



        })
} // End progran --total func


//Start Cat function
if(program.cat) {

    clear()

    let questions = []
    //let totalAmt = "0"
    let totalCat1 = 0
    let totalUnCat1 = 0
    let totalCat2 = 0
    let totalUnCat2 = 0
    
    let parse = csv.parse
    let stream = fs.createReadStream(program.cat)
        .pipe(parse({ delimiter: ',', columns: null }))
    
    stream
        .on("error", err => { return console.error(err.message) })
        .on('data', data => {
            let date = data[0]
            let ref = data[11].slice(1,-1)
            let desc = data[1]
            let name = data[2]
            let amt = data[4]
            let amexCat = data[12]
            //let type = data[7]
            if(desc != "ONLINE PAYMENT - THANK YOU") {
                activityList.push({date, ref, name, amt, desc, amexCat})
            }
            
        })
        .on("end", () => {
            activityList.shift() //remove the first item from array which in this case is coloumn names
            catagorize()
        })
    
    let catagorize = function() {
        console.log(chalk.green(`Parse Complete. Total Rows parsed is: ${chalk.blue(activityList.length)} Beginning Catagorizing...`))
        
        activityList.forEach((lineItem, index) => {  
            totalAmt = currency(totalAmt).add(lineItem.amt)
            test(lineItem, index) 
        })
        //console.log(catagories)
        
        // outout a 1st comand line table
        let table1 = new Table({
            head: ['Cat Name', 'Amount', 'Cat Name', 'Amount', 'Cat Name', 'Amount'], 
            style: {
                'padding-top' : 0,
                'padding-bottom' : 0
                //head: [],    //disable colors in header cells
                //border: []  //disable colors for the border
            },
            colWidths: [16, 10, 16, 10, 16, 10]  //set the widths of each column (optional)
        })
    
        let colCount = 0
        let row = []
        catagories.forEach(item => {
                row.push(item.catName)
                row.push(item.amount.toString())
                colCount++
                if((colCount % 3) == 0){
                    table1.push(row)
                    row = []
                }
        })
        if(row.length > 0){
            table1.push(row)
        }
        
        console.log(table1.toString())
        // End output command line table
        
        activityList.forEach((item) => {
            if(item.catComplete) {
                totalCat1 += 1
            } else {
                totalUnCat1 += 1
                store.unCatAmt = currency(store.unCatAmt).add(item.amt)
            }
        })


        //Auto Catagorizing is complete... loop through uncatagoried items and creat questions for each.
        // First create the 'choices' array
        let choices = catagories.map(cat => {
            let thisCat = { 'name' : cat.catName , 'value' : cat.id }
            return thisCat
        })
        //console.log(choices)
    
        let qCount = 0
        activityList.forEach(item => {
            if(item.catComplete != true){
                qCount++
                let question = {
                    type: 'rawlist',
                    name: item.ref,
                    message: `Select Catagory for: ${chalk.grey(item.desc)}, ${item.name}, ${item.amt.toString()} `,
                    choices: choices
                }   
                questions.push(question)
                
            }
        })
        
        console.log(`Total expenses parsed from CSV file: ${totalAmt}`)
        console.log(chalk.yellow(`Intial Catagorization complete. Total Auto-Catagorized items: ${chalk.blue(totalCat1)}`))
        console.log(`Total amount of auto catagorized items: ${store.autoCatAmt}`)
        
        let bar = new ProgressBar('[:bar] :current of :total', { total: activityList.length, width: 20, curr: totalCat1-1, incomplete: " " })
        bar.tick()
        console.log("\n")
        console.log(chalk.yellow(`There are ${chalk.red(totalUnCat1)} items left to catagorize.`))
        console.log(`Total amount of items left to Catagozie: ${store.unCatAmt}`)
        //console.log(questions)

        
        let questionIndex = 0
        ask()
        //console.log(`Number of questions ${questions.length}`)
        function ask() {
            

            inquirer.prompt(questions[questionIndex])
            .then(answer => {
                let catagoryId = answer[questions[questionIndex].name]
                let currentIndex = activityList.findIndex(i => i.ref == questions[questionIndex].name )
                let currentAmt = activityList[currentIndex].amt
                catagories[catagoryId-1].amount = currency(catagories[catagoryId-1].amount).add(currentAmt)
                
                bar.tick(1)
                questionIndex++
                if(questionIndex < questions.length) {
                    ask()
                } else {
                    showFinalTable()
                    console.log("Writing report to disc...")
                    createReport()
                }
            })
            .catch(err => {
                console.log(`Error: Amount currently working on is: ${currentAmt}...My error is: ${err}`)
            })
        }

        function showFinalTable() {
            let table2 = new Table({
                head: ['Cat Name', 'Amount', 'Cat Name', 'Amount', 'Cat Name', 'Amount'], 
                style: {
                    'padding-top' : 0,
                    'padding-bottom' : 0
                    //head: [],    //disable colors in header cells
                    //border: []  //disable colors for the border
                },
                colWidths: [16, 10, 16, 10, 16, 10]  //set the widths of each column (optional)
            })
            let colCount = 0
            let row = []
            let finalTotal = 0
            catagories.forEach(item => {
                    finalTotal = currency(finalTotal).add(item.amount)
                    row.push(item.catName)
                    row.push(item.amount.toString())
                    colCount++
                    if((colCount % 3) == 0){
                        table2.push(row)
                        row = []
                    }
            })
            if(row.length > 0){
                table2.push(row)
            }
            let totalRow = ["Grand Total", { colSpan: 5, content: finalTotal.toString() }]
            table2.push(totalRow)
            

            console.log(table2.toString())
            // End output command line table
        }
        
        function createReport() {
            let htmlOptions = { 
                format: 'Letter', 
                    border: {
                        top: "1in",            // default is 0, units: mm, cm, in, px
                        right: ".5in",
                        bottom: "1in",
                        left: ".5in"
                    }
                }
            let reportDate = new Date()
            let reportName = `Amex Cat Report - ${reportDate.toDateString()}.pdf`

            pdf.create(createdHtml(), htmlOptions).toStream(function(err, stream) {
                if (err) return console.log(err)
                stream.pipe(fs.createWriteStream(`./${reportName}`))
                console.log(`Report creates successfully at ./${reportName} `)
            })
        }

    
    }
    
    
    //// create html table for output to PDF report ////
    let createdHtml = function(){
        let colCount = 0
        let tableRows = ""
        catagories.forEach(item => {
            tableRows += `<td>${item.catName}</td><td align="right">${item.amount.toString()}</td>`
            colCount++
            if((colCount % 2) == 0){
                tableRows += "</tr><tr>"
            }
        })
    
        let today = new Date()
        let html = `
            <html>
                <body>
                <h1>Amex Catagorization Report</h1>
                <h3>Date: ${today.getMonth()} - ${today.getDate()} - ${today.getFullYear()}</h3>
        
                <table border="1" width="100%">
                    <tr>
                        <th width="35%"><b>Name</b></th>
                        <th width="15%"><b>Amount</b></th>
                        <th width="35%"><b>Cat Name</b></th>
                        <th width="15%"><b>Amount</b></th>
                    </tr>
                    <tr>
                        ${tableRows}
                    </tr>
                </table>
                </body>
            </html>
            `
        return html
    }    


} // End -cat function
