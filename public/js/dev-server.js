const liveServer = require('live-server');

const params = {
    port: 8080,
    root: './src/html',
    open: true,
    file: 'index.html'
};

liveServer.start(params);