const fs = require('fs');
const jayson = require('jayson/promise');
const promisify = require('util').promisify;

const logger = require('./logger');
const browser = require('./browser');

const RequestError = require('./error');

const login = require('./fetcher/login');
const edtFetch = require('./fetcher/edt');
const notes = require('./fetcher/notes');
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

        throw new server.error(-32603, err.toString());
    }
}

async function fetch(page, { username, password, link })
{
    let time = Date.now();

    let { classe, name, avatar } = await login(page, username, password, link);
    let edt = await edtFetch(page);
    let { lastNotes, moyennes } = await notes(page);
    let homeworks = await homeworksFetch(page);

    logger.info(`Fetched user '${username}' in ${(Date.now() - time) / 1000}s`);
    await page.close();

    return {
        classe,
        name,
        avatar,

        edt,
        lastNotes,
        moyennes,
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