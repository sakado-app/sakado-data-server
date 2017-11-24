const logger = require('../logger');
const crypto = require('crypto');

async function login(client, username, password)
{
    logger.info(`Starting login for client #${client.id}, account '${username}'`);
    const page = client.page;

    await page.goto('http://notes.lyc-joffre-montpellier.ac-montpellier.fr/', { waitUntil: 'networkidle2' });

    let url = page.url();
    logger.info(`Current URL for client #${client.id} : '${url}'`);

    if (url.includes('identifiant='))
    {
        await finishLogin(client, username, page);
        return;
    }

    if (url.includes('/cas/login?service='))
    {
        const loginUrl = "https://" + await page.evaluate(function () {
            // Code extrait de la page du CAS quand on clique sur "Etablissement éducation nationale"
            creerCookie('service', window.location.href, 2);
            creerCookie('fim', '2', 2);

            return Promise.resolve(getIdpUrl("2", true));
        });

        await page.goto(loginUrl, { waitUntil: 'networkidle0' });
    }

    await page.waitFor("#user");

    await page.evaluate(function (username, password) {
        document.querySelector("#user").value = username;
        document.querySelector("#password").value = password;

        document.querySelector("#form_login").submit();
    }, username, password);

    await Promise.race([page.waitFor("#erreurs_login"), page.waitFor("#id_body")]);
    url = page.url();

    if (url.includes("CTLoginErrorMsg")) {
        throw await page.evaluate(function () {
            return Promise.resolve(document.querySelector("#erreurs_login").innerHTML);
        });
    }

    await finishLogin(client, username, page);
}

async function finishLogin(client, username, page)
{
    await page.waitFor("#GInterface_T", {
        timeout: 45000
    });

    client.token = crypto.randomBytes(64).toString('hex');
    logger.info(`Successfully logged in client #${client.id} : '${username}'`);
}

module.exports = (client, params) => {
    const username = params.username;
    const password = params.password;

    login(client, username, password).then(() => {
        client.socket.write(JSON.stringify({
            success: true,
            token: client.token
        }));
    }).catch(err => {
        logger.warn(`Error while logging in '${username}' : ${err}`);

        client.socket.write(JSON.stringify({
            success: false,
            error: err.toString()
        }));
    });
};