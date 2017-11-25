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

function fromToken(token)
{
    return sessions[token];
}

module.exports = {
    open: open,
    fromToken: fromToken
};