"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
console.log("ASJDKASJDKLASDd");
app.get("../", (req, res) => {
    res.send("<h1>Hello world</h1>");
});
server.listen(3000, () => {
    console.log("Server started on 3000");
});
class User {
    constructor(uid, username, pass) {
        let t = this;
        t.username = username;
        t.pass = pass;
        if (uid == null)
            uid = crypto.randomUUID();
        t.uid = uid;
    }
    username;
    pass;
    uid;
    save() {
        users.set(this.username, this);
        fs.writeFile("users/" + this.username + ".json", JSON.stringify(this), (err) => {
            if (err)
                console.log("ERR: saving user", err);
        });
    }
}
let users = new Map();
function init() {
    let user = new User(null, "Bobert", "pass");
    // user.save();
    // users.set(user.uid,user);
}
function getUser(username) {
    return users.get(username);
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
// writeUsers();
// fs.writeFileSync("test.txt","hello there 123!");
