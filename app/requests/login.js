const logger = require('../logger');
const response = require('../response');

async function login(id, session, username, password)
{
    logger.info(`Starting login for session #${session.id}, account '${username}'`);
    const page = session.page;

    await page.goto('http://notes.lyc-joffre-montpellier.ac-montpellier.fr/', { waitUntil: 'networkidle2' });

    let url = page.url();
    logger.info(`Login start URL for session #${session.id} : '${url}'`);

    if (url.includes('identifiant='))
    {
        return await finishLogin(id, session, username);
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

    await page.waitFor('#user', {
        timeout: 60000
    });

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

    return await finishLogin(id, session, username);
}

async function finishLogin(id, session, username)
{
    await session.page.waitFor('#GInterface_T', {
        timeout: 60000
    });

    logger.info(`Successfully logged in session #${session.id} : '${username}'`);
    session.username = username;

    return response.success(id);
}

module.exports = (id, session, params) => login(id, session, params.username, params.password);