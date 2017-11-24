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

/*require('./app/server').start().then(() => {
    console.log('\n--> Serveur arrêté normalement');
    // process.exit(0);
}).catch(err => {
    console.log(`\n--> Serveur arrêté avec erreur`);
    console.error(err);
    process.exit(1);
});*/