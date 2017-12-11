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

async function login(session, { username, password })
{
    logger.info(`Starting login for session #${session.id}, account '${username}'`);

    const page = session.page;
    await page.goto('http://notes.lyc-joffre-montpellier.ac-montpellier.fr/eleve.html?login=true', { waitUntil: 'networkidle2' });

    let url = page.url();
    logger.info(`Login start URL for session #${session.id} : '${url}'`);

    await session.page.waitFor('input', {
        timeout: 60000
    });

    await page.evaluate(function() {
        let inputs = document.querySelectorAll("input");

        inputs[0].classList.add('username-field');
        inputs[1].classList.add('password-field');
        inputs[2].classList.add('login-button');
    });

    await page.click('.username-field');
    await page.keyboard.type(username, { delay: 100 });

    await page.click('.password-field');
    await page.keyboard.type(password, { delay: 100 });

    await page.click('.login-button');

    logger.info(`Logging in session #${session.id} : '${url}'...`);

    await Promise.race([page.waitFor('.Message_Cadre0'), page.waitFor('#GInterface_T')]);
    let result = await page.evaluate(function() {
        let cadre = document.querySelector(".Message_Cadre0");

        if (cadre === null)
        {
            return Promise.resolve('success');
        }

        return Promise.resolve(document.querySelector(".Message_Cadre0").querySelector(".Texte10.Espace.AlignementHaut").innerText.split('\n')[0]);
    });

    if (result === 'success')
    {
        logger.info(`Successfully logged in session #${session.id} : '${username}'`);
        session.username = username;
        session.password = password;

        return;
    }

    logger.info(`Login failed for session #${session.id} : ${result}`);

    throw new RequestError(result);
}

module.exports = login;