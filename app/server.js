const net = require('net');
const fs = require('fs');

const logger = require('./logger');
const browser = require('./browser');
const clientManager = require('./client_manager');

let server;

class Client
{
    constructor(id, socket, page)
    {
        this.id = id;
        this.socket = socket;
        this.page = page;

        this.token = null;
        this.logged = false;
    }

    address()
    {
        return this.socket.address().address;
    }
}

function start(address, port)
{
    server = net.createServer(onClient);
    server.listen(port, address);

    logger.info(`Server listening on ${address}:${port}`);
}

function onClient(socket)
{
    logger.info(`Connection received from ${socket.address().address}, waiting for client info`);
    socket.on('data', data => {
        try
        {
            handleData(socket, data);
        }
        catch (e)
        {
            logger.warn(`Fatal error while handling data from '${socket.address().address}'`);
            console.error(e);

            logger.warn(`Closing connection from '${socket.address().address}'`);
            socket.end(clientManager.error(`Fatal error : ${e}`));
        }
    });
}

function handleData(socket, dataRaw)
{
    const data = JSON.parse(dataRaw);

    if (data.type === "init")
    {
        let id = nextId();

        logger.info(`Initializing client #${id} (${socket.address().address})`);
        browser.newPage().then(page => {
            let client = new Client(id, socket, page);
            clientManager.handle(client);

            socket.write(JSON.stringify({
                success: true,
                id: id
            }));
        });

        return;
    }

    let request = data.request;
    let file = `./requests/${request}`;

    let client = clientManager.getClientByAddress(socket.address().address);

    if (client === undefined)
    {
        socket.write(clientManager.error("You aren't initialized (send init request first)"));
        return;
    }

    if (!fs.existsSync(`./app/${file}.js`))
    {
        socket.write(clientManager.error(`Unknown request '${request}'`));
        logger.warn(`Client #${client.id} (${client.address()} requested unknown request : '${request}' (should be at '${file}.js')`);

        return;
    }

    require(file)(clientManager.getClientByAddress(socket.address().address), data.params);
}

let next = 0;

function nextId()
{
    next += 1;
    return next;
}

module.exports = {
    start: start
};
