const logger = require('./logger');
const puppeteer = require('puppeteer');

let browser;

async function start()
{
    logger.info(`Starting chrome browser...`);
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
}

function newPage()
{
    return browser.newPage();
}

module.exports = {
    start: start,
    newPage: newPage
};