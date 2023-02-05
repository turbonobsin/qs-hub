"use strict";
///main ver
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const express = require("express");
const http = require("http");
const socket = require("socket.io");
const readline = require("readline");
const node_process_1 = require("node:process");
const rl = readline.createInterface({ input: node_process_1.stdin, output: node_process_1.stdout });
// import siofu = require("socketio-file-upload");
const app = express();
const server = http.createServer(app);
const io = new socket.Server(server);
// app.use(siofu.router);
app.use(express.static("../../frontend/out"));
/*app.get("../",(req,res)=>{
    res.send("<h1>Hello world</h1>");
});*/
class Collection {
    constructor(name, desc, arr, pub) {
        let t = this;
        t.name = name;
        t.desc = desc;
        t.arr = arr;
        t.pub = pub;
    }
    name;
    desc;
    arr;
    pub;
}
class User {
    constructor(uid, username, name, pass) {
        let t = this;
        t.username = username;
        t.name = name;
        t.pass = pass;
        // if(uid == null) uid = crypto.randomUUID();
        if (uid == null) {
            core.userAmt++;
            uid = core.userAmt.toString();
            core.save();
        }
        t.uid = uid;
    }
    username;
    name;
    pass;
    uid;
    sockets = [];
    files = [];
    fileNum = 0;
    dateJoined = null;
    lastOnline = null;
    friends = [];
    collections = [];
    // collections:Collection[] = [new Collection("Public Files","These files are publically displayed to anyone.",[],true)];
    likes = [];
    pub = [];
    publicLikes = false;
    save() {
        let t = this;
        function write() {
            fs.writeFile(`users/${t.uid}.json`, JSON.stringify(t), { encoding: "utf8" }, (err) => {
                if (err) {
                    console.log("Error writing file:", err);
                    return;
                }
                // console.log(":user write successful");
            });
        }
        users.set(t.uid, t);
        fs.stat("users/" + t.uid, (err, stats) => {
            write();
            /*if(err){
                fs.mkdir("users/"+t.uid,(err)=>{
                    if(err){
                        console.log(err);
                        return;
                    }
                    write();
                });
                return;
            }
            write();*/
        });
        if (false)
            fs.writeFile("users/" + this.username + ".json", JSON.stringify(this), (err) => {
                if (err)
                    console.log("ERR: saving user", err);
            });
    }
}
class ImgFile {
    constructor(name, data, owner) {
        let t = this;
        t.name = name;
        t.data = data;
        t.owner = owner;
    }
    name;
    data;
    owner;
    views = [];
    likes = [];
    title = "";
    desc = "";
    comments = [];
    id = -1;
    speed = 8;
    delay = 0;
    pub = false;
    save() {
        let t = this;
        fs.writeFile(`files/${this.id}.json`, JSON.stringify(this), { encoding: "utf8" }, (err) => {
            if (err) {
                console.log("Err: saving imgFile: ", t.name);
                return;
            }
            // console.log("successfully saved imgFile: ",t.name);
        });
    }
}
// let usernameToUID:Map<string,string> = new Map(); //<username,uid>
// let uidToUsername:Map<string,string> = new Map(); //<uid,username>
let users = new Map(); //<uid,User>
let sockets = new Map(); //<socket.id,uid>
class Core {
    constructor() { }
    fileAmt = 0;
    userAmt = 0;
    users;
    usersName = {};
    save() {
        let tmp = core.usersName;
        core.usersName = null;
        let str = JSON.stringify(this);
        console.log(str);
        fs.writeFile("users/all.json", str, { encoding: "utf8" }, (err) => {
            if (err) {
                console.log("ERR: Failed to save users");
            }
        });
        core.usersName = tmp;
    }
}
let core = null;
async function init() {
    let coreStr = await read("users/all.json");
    core = new Core();
    let obj = JSON.parse(coreStr);
    let ok = Object.keys(obj);
    for (const key of ok) {
        if (obj[key])
            core[key] = obj[key];
    }
    let ok2 = Object.keys(core.users);
    for (const k of ok2) {
        core.usersName[core.users[k]] = k;
    }
    server.listen(3000, () => {
        console.log("Server started on 3000");
        ask();
    });
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
    return new Promise(resolve => {
        fs.readFile(path, { encoding: "utf8" }, (err, data) => {
            if (err)
                resolve(null);
            else
                resolve(data);
        });
    });
}
async function getUser(uid) {
    let user = users.get(uid);
    if (!user) {
        let path = `users/` + uid + ".json";
        let res = await stat(path).catch(() => { });
        if (!res)
            return null;
        let file = await read(path).catch(() => { });
        if (!file)
            return null;
        let data = JSON.parse(file);
        let us = new User(uid, data.username, data.name, data.pass);
        let ok = Object.keys(data);
        for (const key of ok) {
            if (data[key])
                us[key] = data[key];
        }
        // USER LOADED
        users.set(uid, us);
        // uidToUsername.set(us.uid,us.username);
        // usernameToUID.set(us.username,us.uid);
        us.files = data.files;
        us.fileNum = data.fileNum;
        us.sockets = [];
        us.save();
        return users.get(uid);
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
        if (username.length > 30) {
            res("Username can't be longer than 30 characters");
            return;
        }
        let allowedSym = "abcdefghijklmnopqrstuvwxyz_0123456789-";
        for (let i = 0; i < username.length; i++) {
            if (!allowedSym.includes(username[i])) {
                res("Username can't contain the character: " + username[i]);
                return;
            }
        }
        // let user = await getUser(username);
        let checkUsername = core.users[username];
        if (checkUsername != null) {
            res("Username taken");
            return;
        }
        let user = new User(null, username, name, pass);
        user.dateJoined = Date();
        user.lastOnline = user.dateJoined;
        user.save();
        core.users[user.username] = user.uid;
        core.save();
        res(null);
    });
    socket.on("logIn", async (username, pass, res) => {
        let uid = core.users[username];
        if (!uid)
            return;
        let user = await getUser(uid);
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
        sockets.set(socket.id, user.uid);
        res(null, -1);
        socket.emit("loadUser", JSON.stringify(user));
    });
    socket.on("logOut", async () => {
        let uid = sockets.get(socket.id);
        if (uid != null) {
            let user = await getUser(uid);
            user.sockets.splice(user.sockets.indexOf(socket.id), 1);
            sockets.delete(socket.id);
            socket.emit("loadUser", null);
        }
    });
    socket.on("disconnect", async () => {
        let uid = sockets.get(socket.id);
        if (uid != null) {
            let user = await getUser(uid);
            if (!user)
                return;
            user.sockets.splice(user.sockets.indexOf(socket.id), 1);
            sockets.delete(socket.id);
            user.lastOnline = Date();
            user.save();
        }
    });
    async function getFileData(uid, fileId, call) {
        // console.log("GET FILE: ",uid,fileId);
        if (!call)
            return;
        let fileUser = await getUser(uid);
        if (!fileUser) {
            console.log("Can't find user with that uid", uid);
            return;
        }
        // let fileName = fileUser.files[num];
        if (!fileId) {
            console.log("Can't find filename: ", fileId, fileUser.files);
            return;
        }
        // fileName = fileName.split(":")[1];
        fs.readFile("files/" + fileId + ".json", {
            encoding: "utf8"
        }, (err, data) => {
            if (err) {
                console.log("Can't find file:", uid, fileId);
                return;
            }
            let file = JSON.parse(data);
            let rfile = new ImgFile(file.name, file.data, file.owner);
            let ok1 = Object.keys(file);
            for (const k of ok1) {
                if (file[k])
                    rfile[k] = file[k];
            }
            let dat = {}; /*{
                name:fileName,
                owner:username,
                data:file.data
            };*/
            let ok = Object.keys(rfile);
            for (const key of ok) {
                dat[key] = rfile[key];
            }
            // console.log(Object.keys(dat));
            call(JSON.stringify(dat));
        });
    }
    socket.on("updateFile", async (data) => {
        if (!data)
            return;
        if (typeof data != "object")
            return;
        let uid = sockets.get(socket.id);
        if (!uid)
            return;
        let user = await getUser(uid);
        if (!user)
            return;
        let fileId = data.id.toString();
        let file = await new Promise(resolve => {
            getFileData(user.uid, fileId, (data) => {
                let dat = JSON.parse(data);
                let f = new ImgFile(dat.name, dat.data, dat.owner);
                let ok = Object.keys(dat);
                for (const k of ok) {
                    if (dat[k])
                        f[k] = dat[k];
                }
                resolve(f);
            });
        });
        file.title = data.title;
        file.desc = data.desc;
        file.speed = parseFloat(data.speed.toString());
        file.save();
        socket.emit("updateImage", uid, fileId, JSON.stringify(file));
    });
    socket.on("uploadFile", async (name, data, title, desc, atr, call) => {
        if (!call)
            return;
        let uid = sockets.get(socket.id);
        if (!uid)
            return;
        let user = await getUser(uid);
        if (!user)
            return;
        if (false)
            if (!user.files.includes(name)) {
                user.files.push(name);
                user.fileNum++;
                user.save();
            }
        core.fileAmt++;
        let fileId = core.fileAmt;
        user.files.push(fileId.toString());
        user.fileNum++;
        user.save();
        let file = new ImgFile(name, data, user.uid);
        file.title = title;
        file.desc = desc;
        file.speed = atr.speed;
        // core.fileAmt++;
        file.id = fileId;
        core.save();
        fs.writeFile("files/" + file.id + ".json", JSON.stringify(file), {
            encoding: "utf8"
        }, (err) => {
            if (err)
                throw err;
            getFileData(uid, file.id.toString(), call);
            // call();
            // console.log(":uploaded nbg successfully: "+name);
        });
    });
    socket.on("getFileUsername", async (username, fileName, call) => {
        if (!call)
            return;
        // let uid = usernameToUID.get(username);
        let uid = core.users[username];
        if (!uid)
            return;
        // let name = sockets.get(socket.id);
        // let user = await getUser(name);
        getFileData(uid, fileName, call);
    });
    socket.on("getFile", async (uid, fileId, call) => {
        if (!call)
            return;
        // let name = sockets.get(socket.id);
        // let user = await getUser(name);
        getFileData(uid, fileId, call);
    });
    socket.on("getUserData", async (username, load) => {
        if (!username)
            return;
        if (!load)
            return;
        // let uid = usernameToUID.get(username);
        let uid = core.users[username];
        if (!uid)
            return;
        let user = await getUser(uid);
        if (!user)
            return;
        let data = {
            username: user.username,
            name: user.name,
            files: user.files,
            uid: user.uid
        };
        load(JSON.stringify(data));
    });
    socket.on("changeUsername", async (newName) => {
        return;
        let name = sockets.get(socket.id);
        if (!name)
            return;
        let user = await getUser(name);
        if (!user)
            return;
        let stats = await stat("users/" + newName);
        if (stats) {
            console.log("Err: can't change username, new username already taken");
            return;
        }
        user.username = newName;
        user.save();
    });
    async function getFile(fileId) {
        return new Promise(resolve => {
            fs.readFile("files/" + fileId + ".json", { encoding: "utf8" }, (err, data) => {
                if (err) {
                    console.log("Err: Can't like, file not found", fileId);
                    resolve(null);
                    return;
                }
                let jdata = JSON.parse(data);
                let dat = new ImgFile(null, null, null);
                let ok = Object.keys(jdata);
                for (const key of ok) {
                    dat[key] = jdata[key];
                }
                resolve(dat);
            });
        });
    }
    socket.on("clickFile", async (fileId) => {
        let file = await getFile(fileId);
        if (!file)
            return;
        let suid = sockets.get(socket.id);
        if (!suid)
            return;
        if (file.owner == suid)
            return;
        if (file.views.includes(suid))
            return;
        file.views.push(suid);
        file.save();
        socket.emit("updateImage", file.owner, file.id, JSON.stringify(file));
    });
    socket.on("likeImage", async (uid, fileId) => {
        // let username = uidToUsername.get(uid);
        // if(username.startsWith("UID:")) username = userUids.get(username.split(":")[1]);
        let myUid = sockets.get(socket.id);
        if (!myUid)
            return;
        let user = await getUser(myUid);
        if (!user)
            return;
        fs.readFile("files/" + fileId + ".json", { encoding: "utf8" }, (err, data) => {
            if (err) {
                console.log("Err: Can't like, file not found", uid, fileId);
                return;
            }
            let jdata = JSON.parse(data);
            let dat = new ImgFile(null, null, null);
            let ok = Object.keys(jdata);
            for (const key of ok) {
                dat[key] = jdata[key];
            }
            if (dat.likes.includes(myUid)) {
                // console.log("Can't like more than once!");
                // return;
                dat.likes.splice(dat.likes.indexOf(myUid), 1);
                user.likes.splice(user.likes.indexOf(dat.id.toString()), 1);
                // let ind = user.likes.indexOf(username+":"+filename);
                // if(ind != -1) user.likes.splice(ind,1);
            }
            else {
                dat.likes.push(myUid);
                user.likes.push(dat.id.toString());
                // user.likes.push(username+":"+filename);
            }
            dat.save();
            user.save();
            socket.emit("updateImage", uid, fileId, JSON.stringify(dat));
            // console.log("LIKED IMAGE",username,filename,"...by...",name);
        });
    });
    socket.on("deleteFile", async (fileId, call) => {
        if (fileId == null)
            return;
        fileId = fileId.toString();
        console.log("Deleting file: ", fileId);
        let uid = sockets.get(socket.id);
        if (!uid)
            return;
        let user = await getUser(uid);
        if (!user)
            return;
        if (!user.files.includes(fileId)) {
            console.log("ERR: user doesn't have file: ", fileId);
            return;
        }
        fs.rm("files/" + fileId + ".json", (err) => {
            if (err) {
                console.log("Failed to delete file: ", uid, fileId);
                return;
            }
            user.files.splice(user.files.indexOf(fileId), 1);
            user.save();
            function rem(ar) {
                if (ar.includes(fileId))
                    ar.splice(ar.indexOf(fileId), 1);
            }
            rem(user.likes);
            for (const c of user.collections) {
                rem(c.arr);
            }
            // console.log("Deleted file: ",filename," from ",name);
            call();
        });
    });
    socket.on("testUserProps", async (username, prop, call) => {
        let suid = sockets.get(socket.id);
        if (!call)
            return;
        if (typeof call != "function")
            return;
        let uid = core.users[username];
        if (!uid) {
            call(null);
            return;
        }
        let user = await getUser(uid);
        if (!user) {
            call(null);
            return;
        }
        if (prop == "likes") {
            if (user.publicLikes || suid == user.uid)
                call(true);
            else
                call(false);
        }
    });
    socket.on("getNames", async (uid, call) => {
        let user = await getUser(uid);
        if (!user) {
            call(null, null);
            return;
        }
        call(user.username, user.name);
    });
    socket.on("getFileProps", async (fileId, prop, call) => {
        if (!fileId)
            return;
        fileId = fileId.toString();
        let file = await getFile(fileId);
        if (prop == "pub") {
            call(file.pub);
            return;
        }
    });
    socket.on("getUserProps", async (username, prop, call) => {
        let suid = sockets.get(socket.id);
        if (!call)
            return;
        if (typeof call != "function")
            return;
        // let uid = usernameToUID.get(username);
        let uid = core.users[username];
        if (!uid) {
            call(null);
            return;
        }
        let user = await getUser(uid);
        if (!user) {
            call(null);
            return;
        }
        if (prop == "name")
            call(user.name);
        else if (prop == "exists")
            call(true);
        else if (prop == "likes") {
            if (user.publicLikes || suid == user.uid)
                call(JSON.stringify(user.likes));
            else
                call(null);
        }
        else if (prop == "allFiles") {
            if (suid == user.uid)
                call(JSON.stringify(user.files));
            else {
                let l = user.pub;
                call(l);
            }
        }
        else if (prop == "colls") {
            let l = [];
            for (let i = 0; i < user.collections.length; i++) {
                let c = user.collections[i];
                if (c.pub)
                    l.push([i, c.name]);
            }
            call(JSON.stringify(l));
        }
        else if (prop == "pub") {
            call(user.pub);
        }
    });
    socket.on("newCollection", async (colName, desc) => {
        let uid = sockets.get(socket.id);
        if (!uid)
            return;
        let user = await getUser(uid);
        if (!user)
            return;
        let col = new Collection(colName, desc, [], false);
        user.collections.push(col);
        user.save();
    });
    socket.on("addToColl", async (colInd) => {
    });
    socket.on("setFilePub", async (fileId, pub) => {
        if (!fileId)
            return;
        let uid = sockets.get(socket.id);
        if (!uid)
            return;
        let user = await getUser(uid);
        fileId = fileId.toString();
        if (!user)
            return;
        if (!user.files.includes(fileId))
            return;
        if (pub) {
            if (!user.pub.includes(fileId)) {
                user.pub.push(fileId);
                let file = await getFile(fileId);
                if (file) {
                    file.pub = true;
                    file.save();
                }
                user.save();
            }
        }
        else {
            user.pub.splice(user.pub.indexOf(fileId), 1);
            user.save();
            let file = await getFile(fileId);
            if (file) {
                file.pub = false;
                file.save();
            }
        }
    });
});
class Command {
    constructor(name, sig, run) {
        this.name = name;
        this.sig = sig;
        this.run = run;
    }
    name;
    sig;
    run;
}
let cmds = [
    new Command("getuser", "getuser %0", async function (str, resolve) {
        let t = this;
        // let uid = usernameToUID.get(str[0]);
        let uid = core.users[str[0]];
        if (str[0].startsWith("u"))
            uid = str[0].substring(1);
        if (!uid) {
            console.log("ERR: no user at that username");
            resolve();
            return;
        }
        let user = await getUser(uid);
        if (!user)
            console.log(`ERR: User with username (${str[0]}) not found`);
        else
            console.log(user);
        resolve();
    }),
    new Command("gettest", "", async function (str, res) {
        let s = parseInt(str[0]);
        /*if(s == 0){
            for(const [k,v] of usernameToUID){
                console.log(k+" : ",v);
            }
        }
        else if(s == 1){
            for(const [k,v] of uidToUsername){
                console.log(k+" : ",v);
            }
        }*/
        if (s == 2) {
            for (const [k, v] of users) {
                console.log(k + " : ", v);
            }
        }
        else if (s == 3) {
            let ok = Object.keys(core.users);
            for (const k of ok) {
                console.log(k + " : ", core.users[k]);
            }
        }
        else if (s == 4) {
            let ok = Object.keys(core.usersName);
            for (const k of ok) {
                console.log(k + " : ", core.usersName[k]);
            }
        }
        res();
    }),
    new Command("cls", "", async function (str, resolve) {
        process.stdout.write('\u001B[2J\u001B[0;0f');
        resolve();
    }),
    new Command("exit", "", async function (str, resolve) {
        process.exit(0);
    })
];
let closeServer = false;
function ask() {
    if (closeServer)
        return;
    rl.question("> ", async (answer) => {
        let str = answer.split(" ");
        let ran = false;
        for (let cmd of cmds) {
            if (cmd.name == str[0].trim()) {
                str.splice(0, 1);
                await new Promise(async (resolve) => {
                    cmd.run(str, resolve);
                });
                ran = true;
                break;
            }
        }
        if (!ran)
            console.log("Err: invalid command");
        ask();
    });
}
