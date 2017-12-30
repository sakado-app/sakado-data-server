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

const logger = require('./logger');

async function checkForExpire(session)
{
    await session.page.mouse.move(500, 500);
    await sleep(1000);

    const expired = await session.page.evaluate(function()
    {
        const el = document.querySelector('#waispan_id');
        return Promise.resolve(el !== null && el.innerText === "Vous avez été déconnecté");
    });

    if (!expired)
    {
        return true;
    }

    logger.info(`Session id #${session.id} is expired, reconnecting...`);

    await require('./requests/login')('aubergine', session, {
        username: session.username,
        password: session.password
    });

    return false;
}

function dig(element, times)
{
    for (let i = 0; i < times; i++)
    {
        element = element.firstChild;
    }

    return element;
}

function getWeekNo()
{
    let date = new Date();
    let month = date.getMonth();

    let days = Math.floor(month * 30.5) - (month % 2) + date.getDate();
    let weekNo = Math.floor(days / 7);

    weekNo -= 35;

    if (weekNo < 1)
    {
        weekNo += 52;
    }

    if (weekNo > 44) // Pronote max week
    {
        weekNo = 44;
    }

    return weekNo;
}

function sleep(duration)
{
    return new Promise(r => setTimeout(r, duration));
}

module.exports = {
    checkForExpire,
    sleep,
    dig,
    getWeekNo
};