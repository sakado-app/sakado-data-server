const logger = require('../logger');
const response = require('../response');

async function login(session, username, password)
{
    logger.info(`Starting login for session #${session.id}, account '${username}'`);
    const page = session.page;

    await page.goto('http://notes.lyc-joffre-montpellier.ac-montpellier.fr/', { waitUntil: 'networkidle2' });

    let url = page.url();
    logger.info(`Login start URL for session #${session.id} : '${url}'`);

    if (url.includes('identifiant='))
    {
        return await finishLogin(session, username, page);
    }

    if (url.includes('/cas/login?service='))
    {
        const loginUrl = 'https://' + await page.evaluate(function () {
            // Code extrait de la page du CAS quand on clique sur "Etablissement éducation nationale"
            creerCookie('service', window.location.href, 2);
            creerCookie('fim', '2', 2);

            return Promise.resolve(getIdpUrl('2', true));
        });

        await page.goto(loginUrl, { waitUntil: 'networkidle0' });
    }

    await page.waitFor('#user');

    await page.evaluate(function (username, password) {
        document.querySelector('#user').value = username;
        document.querySelector('#password').value = password;

        document.querySelector('#form_login').submit();
    }, username, password);

    await Promise.race([page.waitFor('#erreurs_login'), page.waitFor('#id_body')]);
    url = page.url();

    if (url.includes('CTLoginErrorMsg')) {
        throw await page.evaluate(function () {
            return Promise.resolve(document.querySelector('#erreurs_login').innerHTML);
        });
    }

    return await finishLogin(session, username, page);
}

async function finishLogin(session, username, page)
{
    await page.waitFor('#GInterface_T', {
        timeout: 45000
    });

    logger.info(`Successfully logged in session #${session.id} : '${username}'`);
    session.username = username;

    return response.success();
}

module.exports = (session, params) => login(session, params.username, params.password);