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

const COURS_LENGTH = 308;
const COURS_HEIGHT = 75;

async function edt(session)
{
    await util.checkForExpire(session);

    const page = session.page;

    await page.setViewport({
        width: 1920,
        height: 1080
    });

    console.log('1');
    await page.evaluate(function() {
        const menus = document.querySelectorAll(".objetmenuprincipalComboLabel");

        menus.forEach(m => {
            if (m.innerText === 'Vie\nscolaire')
            {
                m.classList.add('edt-button');
            }
        });
    });
    console.log('1k');

    await page.click('.edt-button');

    await page.waitFor('.Calendrier_Jour_Selection');
    await page.waitFor('.AlignementMilieu.Insecable');

    let weekNo = util.getWeekNo();

    // Selecting current week
    let selectCurrentWeek = async () => {
        await page.click('#GInterface\\.Instances\\[1\\]\\.Instances\\[0\\]_j_' + weekNo);
        await forceUpdate(page);
    };
    await selectCurrentWeek();

    let currentWeek = await updateWeek(page, false, true);

    const weeks = [];
    weeks[0] = await readWeek(page);

    if (weekNo !== 44)
    {
        await updateWeek(page, true, false);
        weeks[1] = await readWeek(page);
    }
    else
    {
        weeks[1] = [];
    }

    // Getting back to current week, else homeworks and other shit will be shifted forward
    await page.click("#" + currentWeek);
    return weeks;
}

async function updateWeek(page, next, first)
{
    console.log('2 : ' + next + ', ' + first);
    const weekId = await page.evaluate(function(next, first)
    {
        let week = document.querySelector('.Calendrier_Jour_Selection');
        let skipWeek = () => {
            let first = week.id.substring(0, week.id.length - 2);
            if (!first.endsWith('_'))
            {
                first += '_';
            }

            let last = week.id.substring(week.id.length - 2, week.id.length);

            if (last.startsWith('_'))
            {
                last = last.substring(1, 2);
            }

            week = document.getElementById(first + (parseInt(last) + 1));
        };

        // Please don't judge
        if (new Date().getDay() >= 6 && first) skipWeek();
        let skipEmptyWeeks = () => { while (week.innerText === 'F') skipWeek(); };
        skipEmptyWeeks();

        if (next) skipWeek();
        skipEmptyWeeks();

        let final = week.id;
        let result = '';

        for (let i = 0, len = final.length; i < len; i++)
        {
            let char = final.charAt(i);

            if (char === '.' || char === '[' || char === ']' )
            {
                result += '\\';
            }

            result += char;
        }

        return result;
    }, next, first);
    console.log('2k');

    console.log(`Clicking on #${weekId}`);
    await page.click(`#${weekId}`);
    await forceUpdate(page);

    console.log(`...`);
    await page.waitFor('table.Cours');

    return weekId;
}

async function forceUpdate(page)
{
    // This below, force the old EDT entries to remove during the new ones loading
    await page.setViewport({
        width: 1920,
        height: 1000
    });
    await page.setViewport({
        width: 1920,
        height: 1080
    });
}

async function readWeek(page)
{
    await page.waitFor('table.Cours');

    console.log('3');
    const cours = await page.evaluate(function()
    {
        const process = str => str.trim().replace('\n', '');

        let coursArray = [];

        const result = document.querySelectorAll('table.Cours');

        for (let i = 0; i < result.length; i++) {
            const cours = result[i];
            let computed = {};
            const lines = Array.from(cours.querySelectorAll('div.AlignementMilieu'));

            if (lines[0].classList.contains('FondBlanc'))
            {
                computed.info = process(lines[0].innerText);
                lines.splice(0, 1);
            }

            if (lines.length === 0)
            {
                continue;
            }

            computed.name = process(lines[0].innerText);

            if (computed.name === '')
            {
                continue;
            }

            if (lines.length > 1)
            {
                computed.prof = process(lines[1].innerText);

                if (computed.prof === computed.name)
                {
                    computed.prof = process(lines[2].innerText);
                    lines.splice(0, 1);
                }
            }

            if (lines.length > 2)
            {
                let second = lines[2].innerText;

                if (second.startsWith('[') || second.startsWith('<') || second.endsWith('.'))
                {
                    lines.splice(0, 1);
                }
            }

            if (lines.length > 2)
            {
                computed.salle = process(lines[2].innerText);
            }

            let parentStyle = cours.parentElement.parentElement.parentElement.style;
            computed.dim = {};

            ['top', 'left', 'width', 'height'].forEach(name => {
                const style = parentStyle[name];
                computed.dim[name] = parseInt(style.substring(0, style.length - 2))
            });

            coursArray.push(computed);
        }

        return Promise.resolve(coursArray);
    });
    console.log('3k');

    console.log('4');
    const dayShift = await page.evaluate(function () {
        return parseInt(document.getElementById("GInterface.Instances[1].Instances[1].Instances[0]_Date0").innerText.substring(5,7));
    });
    console.log('4k');

    cours.forEach(c => {
        c.length = Math.round(c.dim.height / COURS_HEIGHT);
        c.hour = Math.round(c.dim.top / COURS_HEIGHT);
        c.weekday = Math.round(c.dim.left / COURS_LENGTH);
        c.day = dayShift + c.weekday;

        delete c.dim;
    });

    return {
        from: dayShift,
        content: cours
    };
}

module.exports = edt;