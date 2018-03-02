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
    logger.info(`Starting Ile De France CAS login for '${username}' for ${link}`);

    await page.goto('https://ent.iledefrance.fr/adapter#' + encodeURIComponent(link), { waitUntil: 'networkidle2' });

    let url = page.url();
    logger.info(`Login start URL for '${username}' : '${url}'`);

    await page.evaluate((username, password) => {
        document.querySelector("#email").value = username;
        document.querySelector("#password").value = password;

        document.querySelector(".right-magnet").click();
    }, username, password);

    await Promise.race([page.waitFor('.warning'), page.waitFor('iframe')]);

    url = page.url();

    if (!url.includes('adapter'))
    {
        throw new RequestError(await page.evaluate(() =>
        {
            return Promise.resolve(document.querySelector('.warning').innerText);
        }));
    }

    await page.goto('https://0940129e.index-education.net/pronote/eleve.html');
    await page.waitFor('#GInterface_T');

    logger.info(`Successfully logged in '${username}'`);

    return fetchUser(page);
}

module.exports = login;