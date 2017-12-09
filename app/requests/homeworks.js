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

const util = require('../util');

async function homeworks(id, session)
{
    await util.checkForExpire(session);

    let page = session.page;

    await page.mouse.click(200, 40);
    await page.waitFor(".ElementPourNavigation.AlignementGauche.AvecMain.FondBlanc");

    let result = await page.evaluate(function() {
        let homeworks = document.querySelectorAll(".ElementPourNavigation.AlignementGauche.AvecMain.FondBlanc");
        let homeworksArray = [];

        for (let i = 0; i < result.length; i++) {
            let homework = homeworks[i];
        }
    });

    await page.screenshot({ path: 'homeworks.png', fullPage: true });
}

module.exports = (id, session, params) => homeworks(id, session);