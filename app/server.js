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
const fs = require('fs');
const jayson = require('jayson/promise');
const promisify = require('util').promisify;

const logger = require('./logger');
const browser = require('./browser');

const RequestError = require('./error');

const login = require('./fetcher/login');
const atenLogin = require('./fetcher/aten_login');
const idfLogin = require('./fetcher/idf_login');

const timetableFetch = require('./fetcher/timetable');
const marks = require('./fetcher/marks');
const homeworksFetch = require('./fetcher/homeworks');

function start(port)
{
    const server = jayson.server({
        fetch: (args) => {
            try
            {
                return handle(server, args);
            }
            catch(err)
            {
                logger.error(`Internal error`);
                console.error(err);

                throw new server.error(-32603, err.toString());
            }
        }
    });

    server.tcp().listen(port);
    logger.info(`Server listening on 127.0.0.1:${port}`);
}

async function handle(server, args)
{
    let page = await browser.open();

    try
    {
        return await fetch(page, args);
    }
    catch (err)
    {
        if (!(err instanceof RequestError))
        {
            logger.error(`Error during request`);
            console.error(err);

            let crashID = `crash-${new Date().getTime()}`;

            try
            {
                await crashReport(page, crashID, err);
                logger.error(`Saved crash report to crashes/${crashID}`);
            }
            catch(err)
            {
                logger.error(`Also, an error was dropped while saving crash report id '${crashID}'`);
                console.error(err);
            }
        }

        // await page.close();

        throw new server.error(-32603, err.toString());
    }
}

async function fetch(page, { username, password, params: { pronote, variant } })
{
    let time = Date.now();

    let loginFunction;

    switch (variant)
    {
        case 'aten':
            loginFunction = atenLogin;
            break;
        case 'idf':
            loginFunction = idfLogin;
            break;
        default:
            loginFunction = login;
            break;
    }

    let { studentClass, name, avatar } = await loginFunction(page, username, password, pronote);
    let timetable = await timetableFetch(page);
    let { lastMarks, averages } = await marks(page);
    let homeworks = await homeworksFetch(page);

    logger.info(`Fetched user '${username}' in ${(Date.now() - time) / 1000}s`);

    await page.close();

    return {
        studentClass,
        name,
        avatar,

        timetable,
        lastMarks,
        averages,
        homeworks
    };
}

async function crashReport(page, id, err)
{
    const folder = `crashes/${id}/`;

    if (!(await promisify(fs.exists)('crashes/')))
    {
        fs.mkdirSync('crashes/');
    }

    await promisify(fs.mkdir)(folder);

    await promisify(fs.writeFile)(folder + id + '.json', JSON.stringify({
        url: await page.url(),
        content: await page.content(),
        message: err.toString(),
        error: err
    }, null, 4));

    await page.screenshot({ path: folder + id + '.png' });
}

module.exports = start;