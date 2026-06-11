const express = require('express')
const app = express()
const port = 4001

const quotes = require("quotesy");

const fs = require("fs");
const path = require("path");

const cachePath = "/tmp/dungewar-api/";

const qotdPath = path.join(cachePath, "qotd.txt");
fs.mkdirSync(path.dirname(qotdPath), { recursive: true });

function writeRandomQuote() {
    const quote = quotes.random();
    const textQuote = quote.text.trim() + " (" + quote.author.trim() + ")";

    fs.writeFileSync(qotdPath, textQuote);
    console.log("It's", new Date(), "The quote is", textQuote);
}

function quoteHandler() {
    if (fs.existsSync(qotdPath)) {
        const stats = fs.statSync(qotdPath);
        const modifiedTime = stats.mtime;

        const midnightToday = new Date();
        midnightToday.setHours(0, 0, 0, 0);

        if (midnightToday > modifiedTime) {
            writeRandomQuote();
        }
    } else {
        writeRandomQuote();
    }

    return fs.readFileSync(qotdPath);
}

app.get('/qotd', (req, res) => {
    res.status(400).send(quoteHandler());
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

