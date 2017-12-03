const logger = require('./app/logger');
const server = require('./app/server');
const browser = require('./app/browser');

console.log(`.: Sakado data server v${require('./app/version')} :.\n`);

browser.start().then(() => {
    server.start("127.0.0.1", 13556);
}).catch(err => {
    logger.error("Unable to start browser :");
    console.error(err);
});