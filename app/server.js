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
        socket.write(response.error({
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

            socket.write(JSON.stringify({
                status: 'internal-error',
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
        return socket.write(response.malformed({
            reason: `JSON parsing error : '${e}'`
        }));
    }

    let request = data.request;

    if (request === 'open')
    {
        sessionManager.open().then(session => socket.write(response.success({
            token: session.token
        }))).catch(error => socket.write(response.internalError({
            error: error
        })));

        return;
    }

    if (request === undefined || data.token === undefined)
    {
        return socket.write(response.malformed({
            reason: "Fields 'request' and 'token' and required"
        }));
    }

    let session = sessionManager.fromToken(data.token);

    if (request === 'open')
    {
        return socket.write(response.success({
            initialized: session !== undefined,
            logged: (session !== undefined) ? session.username !== undefined : false
        }));
    }

    if (session === undefined)
    {
        return socket.write(response.error({
            error: `Can't find session with token '${data.token}'`
        }));
    }

    let file = `./requests/${request}`;

    if (!fs.existsSync(`./app/${file}.js`))
    {
        logger.warn(`Client requested unknown request : '${request}' (supposed be at '${file}.js')`);

        return socket.write(response.error({
            error: `Unknown request '${request}'`
        }));
    }

    require(file)(session, data.params).then(response => {
        if (response !== undefined)
        {
            socket.write(response);
        }
    }).catch(error => {
        logger.error(`Error during request '${request}'`);
        console.error(error);

        socket.write(response.error({
            error: error.toString()
        }));

        let id = `crash-${new Date().getTime()}`;

        crashReport(session, id).then(() => {
            logger.error(`Saved crash report to crashes/${id}`);
        }).catch(err => {
            logger.error(`Also, an error was dropped while saving crash report id '${id}'`);
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
