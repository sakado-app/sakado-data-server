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

const crypto = require('crypto');

const browser = require('./browser');
const logger = require('./logger');

const sessions = {};

class Session
{
    constructor(token, page)
    {
        this.id = nextId();

        this.token = token;
        this.page = page;
    }
}

let id = 0;

function nextId()
{
    id += 1;
    return id;
}

async function open()
{
    const session = new Session(crypto.randomBytes(64).toString('hex'), await browser.open());
    sessions[session.token] = session;

    logger.info(`Opened new session #${session.id}`);

    return session;
}

async function close(token)
{
    const session = fromToken(token);

    if (session === undefined)
    {
        return;
    }

    await session.page.close();
    delete sessions[token];
}

function fromToken(token)
{
    return sessions[token];
}

module.exports = {
    open,
    close,

    fromToken
};