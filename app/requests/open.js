const sessionManager = require('../session_manager');

async function open()
{
    return (await sessionManager.open()).token;
}

module.exports = open;