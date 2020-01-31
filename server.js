var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var users = {};//for saving who is online

app.get('/', function (req, res) {
  if (req.cookies.user == null) {
    res.redirect('/signin');
  } else {
    res.sendfile('views/index.html');
  }
});
app.get('/signin', function (req, res) {
  res.sendfile('views/signin.html');
});

app.post('/signin', function (req, res) {
  var usersname = users[req.body.name]
  if (usersname) {
    //if username exists, then don't need to login
    res.redirect('/signin');
  }else if (usersname == '') {
    //if empty username name need to login
    res.redirect('/signin');
  } else {
    //if does not exist, then store username into cookie and redirect to index
    res.cookie("user", req.body.name, {maxAge: 1000*60*60*24*30});
    res.redirect('/');
  }
});

var server = http.createServer(app);
var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {

  //someone is online
  socket.on('online', function (data) {
    //save the user
    socket.name = data.user;
    
    if (!users[data.user]) {
      users[data.user] = data.user;
    }
    //emit all online info to all users
    io.sockets.emit('online', {users: users, user: data.user});
  });

  //someone is taking
  socket.on('say', function (data) {
    if (data.to == 'all') {
      // broadcast emit to all other users
      socket.broadcast.emit('say', data);
    } else {
      // talk to one user
      //clients is to store all connected users
      var clients = io.sockets.clients();
      // traverse all found connected users
      clients.forEach(function (client) {
        if (client.name == data.to) {
          //emit the say
          client.emit('say', data);
        }
      });
    }
  });

  //someone is offline
  socket.on('disconnect', function() {
    //if users stores the username
    if (users[socket.name]) {
      //delete users from the username
      delete users[socket.name];
      //broadcast emit the offline info
      socket.broadcast.emit('offline', {users: users, user: socket.name});
    }
  });
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

