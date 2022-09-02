const express = require("express");
const http = require("http");
const ejs = require("ejs");
const sio = require("socket.io");

const app = new express();
app.set("view engine", "ejs");
app.use(express.static("public"));
const httpserver = http.createServer(app);
const io = sio(httpserver);

global.io = io;

PORT = process.env.PORT || 4000

app.get("/", (req, res) =>{
    res.render("index");
})

app.get("/game", (req, res) =>{
    res.render("game");
})

const { userJoin, getCurrentUser } = require("./utils/users");

let clients = [];

io.on("connection", (socket) =>{

    socket.on("joinRoom", ({username, room}) =>{

        // Add client to the client tracker of each room
        if(!clients.includes(room)) {
            clients.push(room)
            clients[room] = [];
        }
        clients[room].push(username);
        console.log(clients);
        socket.emit("clientCount", clients[room]);

        const user = userJoin(socket.id, username, room);
        

        // actually join the room
        socket.join(user.room);

        socket.broadcast
        .to(user.room)
        .emit("message", `${user.username} joined the game.`);
    });

    socket.on("placeChip", (chip) =>{
        console.log(chip);
        let user = getCurrentUser(socket.id);

        io.to(user.room).emit("place", chip);
    })

    socket.on("twoPlayers", (twoplayers) =>{
        let user = getCurrentUser(socket.id);
        io.to(user.room).emit("confirmTwoPlayers");
    })

    socket.on("disconnect", () =>{
        io.emit("message", "user disconnected from the game.");
    })

})

httpserver.listen(3000, () =>{
    console.log(`Listening on port ${PORT}`)
})