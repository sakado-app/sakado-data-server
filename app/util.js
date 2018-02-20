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

function sleep(duration)
{
    return new Promise(r => setTimeout(r, duration));
}

function goTo(page, name)
{
    return page.evaluate(name => {
        let links = Array.prototype.slice.call(document.getElementsByTagName('li')).filter(function(elem) {
            return elem.getAttribute('aria-label') === name;
        });

        if (links.length === 0)
        {
            return Promise.resolve(false);
        }

        links[0].focus();
        links[0].click();

        return Promise.resolve(true);
    }, name);
}

async function waitForLoading(page)
{
    await sleep(500);
    await page.waitForFunction(() => document.getElementsByClassName('Image_Attendre').length === 0);
}

module.exports = {
    goTo,
    waitForLoading
};