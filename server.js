require('dotenv').config();

const express = require('express')
const app = express()
const port = 4001

const quotes = require("quotesy");

const fs = require("fs");
const path = require("path");

const cachePath = "/tmp/dungewar-api/";

// const qotdFile = "qotd.txt";
const qotdPath = path.join(cachePath, "qotd.txt");
const oilPath = path.join(cachePath, "oil-data.txt");
fs.mkdirSync(path.dirname(qotdPath), { recursive: true });

function fetchCache(filePath, timeout = 1000 * 60 * 60 * 24, resetAtMidnight = false) {


    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const modifiedTime = stats.mtime;

        const rightNow = new Date();
        if (resetAtMidnight) {
            rightNow.setHours(0, 0, 0, 0);

            if (rightNow > modifiedTime) {
                console.log("Since", rightNow, ">", modifiedTime, "changing cache...")
                return false;
            }
        } else {
            if (rightNow > modifiedTime.getTime() + timeout) {
                console.log("Since", rightNow, ">", modifiedTime, "+", timeout, "changing cache...")
                return false;
            }
        }
    } else {
        console.log("Since", filePath, "doesn't exist", "changing cache...")
        return false;
    }

    return fs.readFileSync(filePath);
}

function quoteHandler() {
    let quote = fetchCache(qotdPath, 0, resetAtMidnight = true);
    if (quote) return quote;
    else {
        // Write random quote
        const quote = quotes.random();
        const textQuote = quote.text.trim() + " (" + quote.author.trim() + ")";

        fs.writeFileSync(qotdPath, textQuote);
        console.log("It's", new Date(), "The new quote is", textQuote);

        return textQuote;
    }
}

async function oilHandler() {
    let oilData = JSON.parse(fetchCache(oilPath, timeout = 1000 * 60 * 60 * 5));
    if (oilData) return oilData;
    else {
        const url = 'https://api.oilpriceapi.com/v1/prices/latest?by_code=BRENT_CRUDE_USD';

        await fetch(url, {
            method: 'GET', // Optional, GET is the default method
            headers: {
                'Authorization': process.env.OIL_API_KEY,
                'Accept': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                fs.writeFileSync(oilPath, JSON.stringify(data));
                console.log("New oil data came in:", data);
            })
        return JSON.parse(fetchCache(oilPath, timeout = 1000 * 60 * 60 * 5));
    }
}

app.get('/qotd', (req, res) => {
    res.status(200).send(quoteHandler());
})

app.get('/oil-full', async (req, res) => {
    try {
        // Await the async function
        const data = await oilHandler();
        
        if (!data) {
            return res.status(503).send("Service Unavailable: Could not fetch oil data");
        }
        
        // Assuming oilHandler returns a parsed object or string
        res.status(200).send(data);
    } catch (error) {
        console.error("Route error:", error);
        res.status(500).send("Internal Server Error");
    }
})

app.get('/oil-simple', async (req, res) => {
    try {
        // Await the async function
        const data = await oilHandler();
        
        if (!data) {
            return res.status(503).send("Service Unavailable: Could not fetch oil data");
        }
        
        // Assuming oilHandler returns a parsed object or string
        res.status(200).send(data.data.formatted);
    } catch (error) {
        console.error("Route error:", error);
        res.status(500).send("Internal Server Error");
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

