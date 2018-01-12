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

async function login(session, { link, username, password })
{
    logger.info(`Starting login for session #${session.id}, account '${username}'`);

    const page = session.page;
    await page.goto(`${link}eleve.html?login=true`, { waitUntil: 'networkidle2' });

    const url = page.url();
    logger.info(`Login start URL for session #${session.id} : '${url}'`);

    await session.page.waitFor('input', {
        timeout: 60000
    });

    await page.evaluate(function()
    {
        const [username, password, button] = document.querySelectorAll("input");

        username.classList.add('username-field');
        password.classList.add('password-field');
        button.classList.add('login-button');
    });

    await page.click('.username-field');
    await page.keyboard.type(username);

    await page.click('.password-field');
    await page.keyboard.type(password);

    await page.click('.login-button');

    logger.info(`Logging in session #${session.id} : '${url}'...`);

    await Promise.race([page.waitFor('.Message_Cadre0'), page.waitFor('#GInterface_T')]);
    const result = await page.evaluate(function()
    {
        const cadre = document.querySelector(".Message_Cadre0");

        if (cadre === null)
        {
            return Promise.resolve('success');
        }

        return Promise.resolve(document.querySelector(".Message_Cadre0").querySelector(".Texte10.Espace.AlignementHaut").innerText.split('\n')[0]);
    });

    if (result !== 'success')
    {
        logger.info(`Login failed for session #${session.id} : ${result}`);

        throw new RequestError(result);
    }

    logger.info(`Successfully logged in session #${session.id} : '${username}'`);

    session.username = username;
    session.password = password;
    session.link = link;

    let [classe, name, avatar] = await page.evaluate(function() {
        let content = document.getElementById("GInterface.Instances[0]_aideApresConnexion").innerText;
        let full = content.split('-')[1].trim();

        let classe = full.substring(full.indexOf('(') + 1, full.indexOf(')'));
        let name = full.substring(0, full.indexOf('(') - 1);
        let avatar = document.querySelector("img").src;

        return [classe, name, avatar];
    });

    return { classe, name, avatar };
}

module.exports = login;