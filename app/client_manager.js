const clients = {};

function handle(client)
{
    clients[client.address()] = client;
    // TODO: Manage timeout
}

function error(message)
{
    return JSON.stringify({
        success: false,
        error: message
    });
}

function getClientByAddress(address)
{
    return clients[address];
}

module.exports = {
    handle: handle,
    error: error,
    getClientByAddress: getClientByAddress
};