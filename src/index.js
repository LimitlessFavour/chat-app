const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public")

app.use(express.static(publicDirectoryPath));

app.get('', (req, res) => {
    res.render('index')
});

io.on('connection', function (socket) {
    console.log('New websocket connection');

    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({id: socket.id, username, room});

        if (error) {
          return  callback(error);
        }

        //using socket.join to join a given chat room.
        //basically this gives us access to a whole way to emit events specifically to that room.
        socket.join(user.room);
        socket.emit('message', generateMessage('Admin','Welcome'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined!`));
        //updating users list
        io.to(user.room).emit('roomData',{
            room : user.room,
            users: getUsersInRoom(user.room),
        })

        callback();
    });

    //listening for an 'messageSent' event from the client.
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        //if message is profane.
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }

        io.to(user.room).emit('message', generateMessage(user.username,message));
        callback(); //telling the client that it has acknowledged it- no error message.
    });
    //
    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();
        if (filter.isProfane(location)) {
            return console.log('Unaccepted input');
        }

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`));
        callback();
    });
    //when a user disconnects.
    socket.on('disconnect', () => {
        //remove user once the user disconnects.
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message', generateMessage(user.username,`${user.username} has left`));

            io.to(user.room).emit('roomData',{
                room : user.room,
                users: getUsersInRoom(user.room),
            })
        }
    });

});


server.listen(port, () => {
        console.log('Server is up on port 3000')
    }
)
