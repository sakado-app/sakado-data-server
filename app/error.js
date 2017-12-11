class RequestError extends Error
{
    constructor(...params)
    {
        super(...params);

        if(Error.captureStackTrace)
        {
            Error.captureStackTrace(this, RequestError);
        }
    }
}

module.exports = RequestError;