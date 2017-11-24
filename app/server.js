const puppeteer = require('../node_modules/puppeteer/lib/Puppeteer');

async function start()
{
    console.log("--> Démarrage de chrome...");

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    console.log("--> Accès au CAS...");

    await page.goto('http://notes.lyc-joffre-montpellier.ac-montpellier.fr/', { waitUntil: 'networkidle2' });

    // console.log(page.url());

    const loginUrl = "https://" + await page.evaluate(function () {
        // Code extrait de la page du CAS quand on clique sur "Etablissement éducation nationale"
        creerCookie('service', window.location.href, 2);
        creerCookie('fim', '2', 2);

        return Promise.resolve(getIdpUrl("2", true));
    });

    // console.log(loginUrl);

    console.log("--> En attente de redirection vers ATEN...");

    await page.goto(loginUrl, { waitUntil: 'networkidle0' });
    await page.waitFor("#user");

    // console.log(page.url());


    const username = process.argv[2];
    const password = process.argv[3];

    console.log(`--> Connexion via le compte ATEN (${username})...`);

    await page.evaluate(function (username, password) {
        document.querySelector("#user").value = username;
        document.querySelector("#password").value = password;

        document.querySelector("#form_login").submit();
    }, username, password);

    let result = await Promise.race([page.waitFor("#erreurs_login"), page.waitFor("#id_body")])
        .then(() => {
            const url = page.url();
            // console.log(url + "\n");

            if (url.includes("CTLoginErrorMsg")) {
                return page.evaluate(function () {
                    return Promise.resolve("--> Impossible de se connecter : " + document.querySelector("#erreurs_login").innerHTML);
                }).then(res => {
                    // console.error(res);
                    return Promise.resolve();
                })
            } else {
                return Promise.resolve("--> Connexion réussie");
            }
        });

    console.log(result);

    if (!result.startsWith("--> Connexion réussie")) {
        browser.close();
        return;
    }

    //console.log(page.url());

    console.log("--> Démarrage de Pronote...");
    await page.waitFor(".objetAffichagePageAccueil_colonne");

    console.log("--> Pronote démarré : Capture d'écran...");
    //console.log(await page.content());
    await page.screenshot({path: 'news.png', fullPage: true});

    console.log("--> Terminé !");

    await browser.close();
}

module.exports = {
    start: start
};