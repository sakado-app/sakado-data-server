const status = ['success', 'error', 'internalError', 'malformed'];

function response(status, id, response)
{
    if (response === undefined)
    {
        response = {};
    }

    response['status'] = status;

    if (id !== undefined)
    {
        response['id'] = id;
    }

    return JSON.stringify(response) + "\n";
}

status.forEach(status => module.exports[status] = (id, r) => response(status, id, r));