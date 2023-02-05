"use strict";
///main ver
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const http = require("http");
const socket = require("socket.io");
// import siofu = require("socketio-file-upload");
const app = express();
const server = http.createServer(app);
const io = new socket.Server(server);
// app.use(siofu.router);
app.use(express.static("../../frontend/out"));
/*app.get("../",(req,res)=>{
    res.send("<h1>Hello world</h1>");
});*/
server.listen(3000, () => {
    console.log("Server started on 3000");
});
class User {
    constructor(uid, username, name, pass) {
        let t = this;
        t.username = username;
        t.name = name;
        t.pass = pass;
        if (uid == null)
            uid = crypto.randomUUID();
        t.uid = uid;
    }
    username;
    name;
    pass;
    uid;
    sockets = [];
    files = [];
    fileNum = 0;
    save() {
        let t = this;
        function write() {
            fs.writeFile(`users/${t.username}/user.json`, JSON.stringify(t), { encoding: "utf8" }, (err) => {
                if (err) {
                    console.log("Error writing file:", err);
                    return;
                }
                console.log(":user write successful");
            });
        }
        users.set(t.username, t);
        fs.stat("users/" + t.username, (err, stats) => {
            if (err) {
                fs.mkdir("users/" + t.username, (err) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    write();
                });
                return;
            }
            write();
        });
        if (false)
            fs.writeFile("users/" + this.username + ".json", JSON.stringify(this), (err) => {
                if (err)
                    console.log("ERR: saving user", err);
            });
    }
}
class ImgFile {
    constructor(data, owner) {
        let t = this;
        t.data = data;
        t.owner = owner;
    }
    data;
    owner;
}
let users = new Map();
let sockets = new Map();
async function init() {
    let user = await getUser("Bobert");
    if (!user) {
        user = new User(null, "Bobert", "Bobby Boy", "pass");
        user.save();
    }
    console.log("Hello " + user.username + "!");
    // users.set(user.uid,user);
}
async function stat(path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err)
                reject("Failed");
            else
                resolve(stats);
        });
    });
}
async function read(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, { encoding: "utf8" }, (err, data) => {
            if (err)
                reject("Failed");
            else
                resolve(data);
        });
    });
}
async function getUser(username) {
    let user = users.get(username);
    if (!user) {
        let path = `users/${username}`;
        let res = await stat(path).catch(() => { });
        if (!res)
            return null;
        let file = await read(path + "/user.json").catch(() => { });
        if (!file)
            return null;
        let data = JSON.parse(file);
        let us = new User(data.uid, username, data.name, data.pass);
        users.set(username, us);
        us.files = data.files;
        us.fileNum = data.fileNum;
        return users.get(username);
    }
    return user;
}
function writeUsers() {
    let ar = {};
    for (const [k, v] of users) {
        ar[k] = v;
    }
    fs.writeFile("users.json", JSON.stringify(ar), (err) => {
        console.log("ERR: ", err);
    });
}
function readUsers() {
    // fs.readFile("users.json")
}
init();
io.on("connection", socket => {
    socket.on("msg", txt => {
        console.log("MSG: ", txt);
    });
    socket.on("createUser", async (username, name, pass, res) => {
        let user = await getUser(username);
        if (user) {
            res("Username taken");
            return;
        }
        user = new User(null, username, name, pass);
        user.save();
        res(null);
    });
    socket.on("logIn", async (username, pass, res) => {
        let user = await getUser(username);
        if (!user) {
            res("No user found with that username", 0);
            return;
        }
        if (user.sockets.includes(socket.id)) {
            res("Already signed in", -1);
            return;
        }
        if (user.pass != pass) {
            res("Password incorrect", 1);
            return;
        }
        user.sockets.push(socket.id);
        sockets.set(socket.id, user.username);
        res(null, -1);
        socket.emit("loadUser", JSON.stringify(user));
    });
    socket.on("logOut", async () => {
        let username = sockets.get(socket.id);
        if (username != null) {
            let user = await getUser(username);
            user.sockets.splice(user.sockets.indexOf(socket.id), 1);
            sockets.delete(socket.id);
            socket.emit("loadUser", null);
        }
    });
    socket.on("disconnect", async () => {
        let username = sockets.get(socket.id);
        if (username != null) {
            let user = await getUser(username);
            user.sockets.splice(user.sockets.indexOf(socket.id), 1);
            sockets.delete(socket.id);
        }
    });
    socket.on("uploadPNG", (name, data) => {
        console.log("SAVING FILE: ", name, data);
        fs.writeFile(name, data, (err) => {
            if (err)
                throw err;
            console.log("saved png");
        });
    });
    socket.on("getPNG", (name, call) => {
    });
    socket.on("uploadFile", async (name, data) => {
        let username = sockets.get(socket.id);
        if (!username)
            return;
        let user = await getUser(username);
        if (!user)
            return;
        // user.files.push(user.fileNum+":"+name);
        user.files.push(name);
        user.fileNum++;
        user.save();
        let file = new ImgFile(data, username);
        fs.writeFile("users/" + username + "/" + name, JSON.stringify(file), {
            encoding: "utf8"
        }, (err) => {
            if (err)
                throw err;
            console.log(":uploaded nbg successfully: " + name);
        });
    });
    socket.on("getFile", async (username, fileName, call) => {
        // let name = sockets.get(socket.id);
        // let user = await getUser(name);
        let fileUser = await getUser(username);
        if (!fileUser) {
            console.log("Can't find username");
            return;
        }
        // let fileName = fileUser.files[num];
        if (!fileName) {
            console.log("Can't find filename: ", fileName, fileUser.files);
            return;
        }
        // fileName = fileName.split(":")[1];
        fs.readFile("users/" + username + "/" + fileName, {
            encoding: "utf8"
        }, (err, data) => {
            if (err) {
                console.log("Can't find file:", username, fileName);
                return;
            }
            let file = JSON.parse(data);
            let dat = {
                name: fileName,
                owner: username,
                data: file.data
            };
            call(JSON.stringify(dat));
        });
    });
    socket.on("getUserData", async (load) => {
        let name = sockets.get(socket.id);
        if (!name)
            return;
        let user = await getUser(name);
        if (!user)
            return;
        let data = {
            username: user.username,
            name: user.name,
            files: user.files
        };
        load(JSON.stringify(data));
    });
});
