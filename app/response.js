const status = ['success', 'error', 'internalError'];

function response(status, response)
{
    if (response === undefined)
    {
        response = {};
    }

    response['status'] = status;
    return JSON.stringify(response);
}

status.forEach(status => module.exports[status] = r => response(status, r));