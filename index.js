require('./app/server').start().then(() => {
    console.log('\n--> Serveur arrêté normalement');
    // process.exit(0);
}).catch(err => {
    console.log(`\n--> Serveur arrêté avec erreur`);
    console.error(err);
    process.exit(1);
});