var WebSocketServer = require('ws').Server, 
	port = process.env.PORT || 8081,
	wss = new WebSocketServer({port: port}),
    	ws_client_jabber = require('ws'),
	wss_host = ''; //insert your host
var Client = require('node-xmpp-client'),
    	ltx = require('node-xmpp-core').ltx;
var client_jabber = new ws_client_jabber(wss_host);
function sendMessage(msg){
    waitForSocketConnection(client_jabber, function(sock_s){
        console.log("message sent!!!");
        sock_s.send(JSON.stringify(msg));
    });
}
function waitForSocketConnection(socket, callback){
    setTimeout(
        function () {
            if (socket.readyState === 1) {
                console.log("Connection is made")
                if(callback != null){
                    callback(socket);
                }
                return;
            } else {
                console.log("wait for connection...")
                client_jabber = new ws_client_jabber(wss_host);
				waitForSocketConnection(client_jabber, callback);			
            }
        }, 50);
}
client_jabber.safeSend = function(data) {
	if (client_jabber.readyState == client_jabber.OPEN) {
		console.log('sending ' + data);
		client_jabber.send(JSON.stringify(data));
	} else {
		throw new Error("could not send - websocket is not open");
	}
};
var client = new Client({
    jid: '', // insert your profile xmpp
    password: '',
    host: ''
});
var clients = {};
console.log('port ', port);
wss.on('connection', function(ws) {
		var id = Math.random();
  		clients[id] = ws;
		console.log('connect ws ' + id);
		ws.on('message', function(message) {
			var message_incoming_site = new ltx.Element('message', {
				to: '', // insert your profile xmpp
				type: 'chat'
				}).c('body').t(JSON.parse(message).message);

    		if (JSON.parse(message).title == 'jabber') {
								for (var key in clients) {
									console.log('key ' + key + 'id' + ws);
									clients[key].send(message);	
								};
			} else {
				client.send(message_incoming_site)
			};
			console.log('message ' + message);
		});
 		ws.on('close', function() {
    	    console.log('close ws ' + id);
			delete clients[id];
			delete id;
  		});
	 });
client.on('stanza', function(stanza) {
    if (stanza.is('message') && stanza.attrs.type === 'chat') {
		var body = stanza.getChild('body');
    	if (!body) {
    		return;
    	}
    	var message = {
  			title: 'jabber',
  			date: new Date(),
			message: body.getText()
		};
		sendMessage(message);
	};
});	
client.on('offline', function () {
    	console.log('Client is offline');
});	
client.on('online', function() {
    console.log('Client is online')
    client.send('<presence/>')
});	
client.on('connect', function () {
	console.log('Connect as')
});
client.on('reconnect', function () {
    console.log('Client reconnects …')
});
client.on('disconnect', function (e) {
    console.log('Client is disconnected', client.connection.reconnect, e)
});
client.on('error', function(e) {
    console.error(e);
    process.exit(1)
});
process.on('exit', function () {
    client.end();
	ws.close();
});
