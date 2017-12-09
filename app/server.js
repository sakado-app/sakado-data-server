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

const net = require('net');
const fs = require('fs');

const logger = require('./logger');
const sessionManager = require('./session_manager');
const response = require('./response');

let server;
let client = null;

function start(address, port)
{
    server = net.createServer(onClient);
    server.listen(port, address);

    logger.info(`Server listening on ${address}:${port}`);
}

function onClient(socket)
{
    if (client !== null)
    {
        socket.write(response.error(undefined, {
            error: `A client is already connected from ${client.address().address}`
        }));

        logger.warn(`A client from ${socket.address().address} tried to connect, but ${client.address().address} is already connected`);

        return;
    }

    client = socket;

    logger.info(`Client connected from ${socket.address().address}`);
    socket.on('data', data => {
        try
        {
            handleData(socket, data);
        }
        catch (e)
        {
            logger.error(`Major error while handling data from '${socket.address().address}'`);
            console.error(e);

            socket.write(response.internalError(undefined, {
                error: e.toString()
            }));
        }
    });
}

function handleData(socket, dataRaw)
{
    let data;

    try
    {
        data = JSON.parse(dataRaw);
    }
    catch (e)
    {
        return socket.write(response.malformed(undefined, {
            reason: `JSON parsing error : '${e}'`
        }));
    }

    let request = data.request;
    let id = data.id;

    if (id === undefined)
    {
        return socket.write(response.malformed(undefined, {
            reason: `Missing 'id' field`
        }));
    }

    if (request === 'open')
    {
        sessionManager.open().then(session => socket.write(response.success(id, {
            result: {
                token: session.token
            }
        }))).catch(error => socket.write(response.internalError(id, {
            error: error
        })));

        return;
    }

    if (request === undefined || data.token === undefined)
    {
        return socket.write(response.malformed(id, {
            reason: "Fields 'request' and 'token' and required"
        }));
    }

    if (request === 'close')
    {
        sessionManager.close(data.token).then(() => {
            socket.write(response.success(id));
        }).catch(error => socket.write(response.internalError(id, {
            error: error
        })));

        return;
    }

    let session = sessionManager.fromToken(data.token);

    if (request === 'status')
    {
        return socket.write(response.success(id, {
            initialized: session !== undefined,
            logged: (session !== undefined) ? session.username !== undefined : false
        }));
    }

    if (session === undefined)
    {
        return socket.write(response.error(id, {
            error: `Can't find session with token '${data.token}'`
        }));
    }

    let file = `./requests/${request}`;

    if (!fs.existsSync(`./app/${file}.js`))
    {
        logger.warn(`Client requested unknown request : '${request}' (supposed be at '${file}.js')`);

        return socket.write(response.error(id, {
            error: `Unknown request '${request}'`
        }));
    }

    require(file)(id, session, data.params).then(response => {
        if (response !== undefined)
        {
            socket.write(response);
        }
    }).catch(error => {
        logger.error(`Error during request '${request}'`);
        console.error(error);

        socket.write(response.error(id, {
            error: error.toString()
        }));

        let crashID = `crash-${new Date().getTime()}`;

        crashReport(session, crashID).then(() => {
            logger.error(`Saved crash report to crashes/${crashID}`);
        }).catch(err => {
            logger.error(`Also, an error was dropped while saving crash report id '${crashID}'`);
            console.error(err);
        });
    });
}

async function crashReport(session, id)
{
    let folder = `crashes/${id}/`;

    if (!fs.existsSync('crashes/')) {
        fs.mkdirSync('crashes/');
    }

    fs.mkdirSync(folder);
    fs.writeFileSync(folder + id + '.json', JSON.stringify({
        url: await session.page.url(),
        content: await session.page.content()
    }, null, 4));

    await session.page.screenshot({ path: folder + id + '.png', fullPage: true });
}

module.exports = {
    start: start
};
