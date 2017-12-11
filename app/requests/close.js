const sessionManager = require('../session_manager');

function close(session)
{
    return sessionManager.close(session.token);
}

module.exports = close;