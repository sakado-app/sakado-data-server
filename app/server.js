const fs = require('fs');
const jayson = require('jayson/promise');
import promisify from 'util';

const logger = require('./logger');
const sessionManager = require('./session_manager');
const RequestError = require('./error');

function start(port)
{
    const methods = {};
    const requests = require('./requests');

    for (const [name, func] of Object.entries(requests))
    {
        methods[name] = args => handle(server, name, func, args);
    }

    const server = jayson.server(methods);

    server.tcp().listen(port);
    logger.info(`Server listening on 127.0.0.1:${port}`);
}

async function handle(server, name, func, args)
{
    if (name === 'open')
    {
        return await func(args);
    }

    let token = args.token;

    if (token === undefined)
    {
        throw new server.error(-32602, 'Missing field "token"');
    }

    let session = sessionManager.fromToken(token);

    if (name !== 'status' && session === undefined)
    {
        throw new server.error(-32602, `Can't find session with token '${token}'`);
    }

    try
    {
        return await func(session, args);
    }
    catch (err)
    {
        if (!(err instanceof RequestError))
        {
            logger.error(`Error during request '${name}'`);
            console.error(err);

            let crashID = `crash-${new Date().getTime()}`;

            try
            {
                await crashReport(session, crashID);
                logger.error(`Saved crash report to crashes/${crashID}`);
            }
            catch(err)
            {
                logger.error(`Also, an error was dropped while saving crash report id '${crashID}'`);
                console.error(err);
            }
        }

        throw new server.error(-32603, err.toString());
    }
}

async function crashReport(session, id)
{
    let folder = `crashes/${id}/`;

    if (!(await promisify(fs.exists)('crashes/')))
    {
        fs.mkdirSync('crashes/');
    }

    await promisify(fs.mkdir)(folder);

    await promisify(fs.writeFile)(folder + id + '.json', JSON.stringify({
        url: await session.page.url(),
        content: await session.page.content()
    }, null, 4));

    await session.page.screenshot({ path: folder + id + '.png', fullPage: true });
}

module.exports = start;