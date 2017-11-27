const status = ['success', 'error', 'internalError', 'malformed'];

function response(status, response)
{
    if (response === undefined)
    {
        response = {};
    }

    response['status'] = status;
    return JSON.stringify(response) + "\n";
}

status.forEach(status => module.exports[status] = r => response(status, r));