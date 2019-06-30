var socketio = require('socket.io');
var io,
  guestNumber = 1,
  nickNames = {},
  namesUsed = [],
  currentRoom = {};

exports.listen = function(server) {
    io = socketio.listen(server);
    io.set('log level', 1);

    io.sockets.on('connection', function(scoket) {
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

        joinRoom(socket, 'lobby');
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttemps(socket, nickNames, namesUsed);
        handleRoomJoining(scoket);

        socket.on('rooms', function() {
            socket.emit('rooms', io.sockets.manager.rooms);
        })
        handleCliendDisconnection(socket, nickNames, namesUsed);
    })

}
// 注册用户
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    var name = 'Guest' + guestNumber;
    nickNames[socket,id] = name;
    socket.emit('nameResult', {
        success: true,
        name: name
    })
    namesUsed.push(name);
    return guestNumber + 1;
}
// 加入房间
function joinRoom (socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', {room: room});
    socket.broadcast.to(room).emit('message', {
        text: nickNames[socketio.id] + ' has joined ' + room + ': '
    })
    var usersInRoom = io.socket.clients(room);
    if (usersInRoom.length > 1) {
        var usersInRoomSummary = 'Users currently in ' + room + ': ';
        for(var index in usersInRoom) {
            var userSocketId = usersInRoom[index].id;
        }
        if (userSocketId != socket.id) {
            if (index > 0) {
                usersInRoomSummary += ', ';
            }
            usersInRoomSummary += nickNames[userSocketId];
        }
    }
    usersInRoomSummary += '.';
    socket.emit('message', {text: usersInRoomSummary});
}
// 修改名称
function handleNameChangeAttemps (socket, nickNames,namesUsed) {
    socket.on('nameAttempt', function (name) {
        if(name.indexOf('Guest') == 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'names cannot begin with "guest"'
            });
        } else {
            if (namesUsed.indexOf(name) == -1) {
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult', {
                    success: true,
                    name: name
                });
                socket.broadcast.to(currentRoom[socketio.id]).emit('message', {
                    text: previousName + ' is now known as ' + name + '.'
                });
            } else {
                socket.emit('nameResult', {
                    success: false,
                    message: 'that name is already in use.'
                })
            }
        }
    })
};

function handleMessageBroadcasting (socket) {
    socket.on('message', function(message) {
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ': ' + message.text
        })
    })
}
function handleRoomJoining (socket) {
    socket.on('join', function(room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    })
}
function handleCliendDisconnection(scoket) {
    socket.on('disconnect', function() {
        var nameIndex = namesUsed.indexOf(nickNames[socketio.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socketio.id];
    })
}