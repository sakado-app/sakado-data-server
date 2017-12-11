['open', 'login', 'handshake', 'edt', 'homeworks', 'close']
    .forEach(r => exports[r] = require(`./${r}`));