/*
 *  Sakado, an app for school
 *  Copyright (C) 2017 Adrien 'Litarvan' Navratil
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const logger = require('../logger');
const RequestError = require('../error');
const fetchUser = require('../user_fetch');

async function login(page, username, password, link)
{
    logger.info(`Starting ATEN CAS login for '${username}' for ${link}`);

    await page.goto('https://www.environnementnumeriquedetravail.fr/cas/login?service=' + encodeURIComponent(link), { waitUntil: 'networkidle2' });

    let url = page.url();
    logger.info(`Login start URL for '${username}' : '${url}'`);

    if (!url.contains('ct_logon_vk.jsp'))
    {
        const loginUrl = 'https://' + await page.evaluate(() =>
        {
            // Code extrait de la page du CAS quand on clique sur "Etablissement éducation nationale"
            creerCookie('service', window.location.href, 2);
            creerCookie('fim', '2', 2);

            return Promise.resolve(getIdpUrl('2', true));
        });

        await page.goto(loginUrl, { waitUntil: 'networkidle0' });
    }

    await page.waitFor('#user');

    await page.evaluate((username, password) =>
    {
        document.querySelector('#user').value = username;
        document.querySelector('#password').value = password;

        document.querySelector('#form_login').submit();
    }, username, password);

    await Promise.race([page.waitFor('#erreurs_login'), page.waitFor('#id_body')]);
    url = page.url();

    if (url.includes('CTLoginErrorMsg'))
    {
        throw new RequestError(await page.evaluate(() =>
        {
            return Promise.resolve(document.querySelector('#erreurs_login').innerHTML);
        }));
    }

    await page.waitFor('#GInterface_T');

    logger.info(`Successfully logged in '${username}'`);

    return fetchUser(page);
}

module.exports = login;