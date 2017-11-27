const logger = require('./logger');
const puppeteer = require('puppeteer');

let browser;

async function start()
{
    logger.info(`Starting chrome browser...`);
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
}

async function open()
{
    let page = await browser.newPage();
    await page.setViewport({
        width: 1920,
        height: 1080
    });

    return page;
}

module.exports = {
    start: start,
    open: open
};