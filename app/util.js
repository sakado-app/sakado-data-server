const logger = require('./logger');

async function checkForExpire(session)
{
    let expired = await session.page.evaluate(function() {
        let el = document.querySelector('#waispan_id');
        return Promise.resolve(el !== null && el.innerText === "Vous avez été déconnecté");
    });

    if (!expired)
    {
        return true;
    }

    logger.info(`Session id #${session.id} is expired, reconnecting...`);

    await require('./requests/login')('aubergine', session, {
        username: session.username,
        password: session.password
    });

    return false;
}

module.exports = {
    checkForExpire: checkForExpire
};