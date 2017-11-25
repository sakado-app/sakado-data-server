const net = require('net');
const fs = require('fs');

const logger = require('./logger');
const browser = require('./browser');
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
    let data = JSON.parse(dataRaw);
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

    let session = sessionManager.fromToken(data.token);

    if (session === undefined)
    {
        socket.write(response.error({
            error: `Can't find session with token '${data.token}'`
        }));

        return;
    }

    let file = `./requests/${request}`;

    if (!fs.existsSync(`./app/${file}.js`))
    {
        socket.write(response.error({
            error: `Unknown request '${request}'`
        }));

        logger.warn(`Client requested unknown request : '${request}' (supposed be at '${file}.js')`);

        return;
    }

    require(file)(session, data.params).then(response => {
        if (response !== undefined)
        {
            socket.write(response);
        }
    }).catch(error => {
        logger.warn(`Error during request '${request}'`);
        console.error(error);

        socket.write(response.error({
            error: error
        }));
    });
}

module.exports = {
    start: start
};
