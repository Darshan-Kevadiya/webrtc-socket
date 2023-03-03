require('dotenv').config();
const express = require("express");
const cors = require('cors')
const http = require("http");
const app = express();
app.use('*', cors())
const server = http.createServer(app);
const socket = require("socket.io");


const io = socket(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});


const users = {};

const socketToRoom = {};

io.on('connection', socket => {
    socket.on("join room", roomID => {
        if (users[roomID]) {
            // const length = users[roomID].length;
            // if (length === 4) {
            //     socket.emit("room full");
            //     return;
            // }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

        socket.emit("all users", usersInThisRoom);
    });

    // socket.on("createPeer", (stream) => {
    //     console.log(stream);
    //     const peer = new SimplePeer({
    //         initiator: true,
    //         trickle: false,
    //         stream,
    //         config: {
    //             iceServers: [
    //                 {
    //                     urls: "stun:relay.metered.ca:80",
    //                 },
    //             ]
    //         }
    //     });
    //     socket.emit("getPeer", peer)
    // })

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
        console.log("disconnectData");
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
        socket.broadcast.emit('user left', socket.id)
    });

});
console.log(users);
server.listen(process.env.PORT || 8000, () => console.log('server is running on port 8000'));


