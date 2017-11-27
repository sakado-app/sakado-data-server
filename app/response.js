const status = ['success', 'error', 'internalError', 'malformed'];

function response(status, response, session)
{
    if (response === undefined)
    {
        response = {};
    }

    response['status'] = status;

    if (session !== undefined)
    {
        response['token'] = session.token;
    }

    return JSON.stringify(response) + "\n";
}

status.forEach(status => module.exports[status] = (session, r) => response(session, status, r));