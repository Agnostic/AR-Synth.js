/* Simple http server for testing */
var connect = require('connect');
connect.createServer(
    connect.static(__dirname)
).listen(8080);