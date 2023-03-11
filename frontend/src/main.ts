import type {io} from "socket.io-client";
import {Account,ImgFile,User} from "../../backend/src/types";
import type {} from "../out/node_modules/@types/wicg-file-system-access";
// import { fromNob, NobsinCtx } from "./NE_1.3.1";

let emptyStr = `{"name":"crazy good orange.nbg","data":"crazy good orange.nbg,16,16,1,00\nff0000,c99600\n@\nlayer\n0,0\nMain\n0:6b,6a,5w,5v,5h,5g,52,4n,4m,48,3s;1:69,68,5u,5t,5f,5e,50,4z,4y,4l,4k,4j,46,45,44\ntrue\n@\n","owner":"1","views":[],"likes":["1"],"title":"Crazy Good Orange","desc":"","comments":[],"id":6,"speed":8,"delay":0,"pub":false}`.replace("/\n/g","#");

//correct version

function preloadMatIcons(){
    let icons = ["visibility","favorite"];
    for(const i of icons){
        let d = document.createElement("div");
        d.className = "material-symbols-outlined";
        d.innerHTML = i;
        document.body.appendChild(d);
        d.style.visibility = "hidden";
    }
}
preloadMatIcons();

const d_menus = document.getElementById("menuArea");
const menu = document.getElementById("menu");
const d_acc = document.getElementById("d_acc");
const b_closeMenu = document.getElementById("b_closeMenu");
const area = document.getElementById("area");
const l_title = document.getElementById("l_title");
const l_title2 = document.getElementById("l_title2");

const l_name = document.getElementById("l_name");
const m_acc = document.getElementById("m_acc");

const b_theme = document.getElementById("theme");
const darkMode = <HTMLLinkElement>document.getElementById("darkMode");
document.body.removeChild(darkMode);
if(!localStorage.getItem("theme")) localStorage.setItem("theme","light");
function updateTheme(){
    let theme = localStorage.getItem("theme");
    if(theme == "light"){
        if(darkMode.parentElement == document.head) document.head.removeChild(darkMode);
        b_theme.children[0].textContent = "light_mode";
    }
    else if(theme == "dark"){
        if(darkMode.parentNode != document.head) document.head.appendChild(darkMode);
        b_theme.children[0].textContent = "dark_mode";
    }
}
updateTheme();
b_theme.onclick = function(){
    let theme = localStorage.getItem("theme");
    if(theme == "light") localStorage.setItem("theme","dark");
    else if(theme == "dark") localStorage.setItem("theme","light");
    updateTheme();
};

const title = "Quick Surface Hub";

function createDropdown(ele:HTMLElement,labels:string[],sym:string[],f:(i:number,d:HTMLElement)=>void){
    ele.addEventListener("mousedown",e=>{
        overMenu = false;
        let rect = ele.getBoundingClientRect();
        let dd = document.createElement("div");
        dd.className = "dropdown";
        for(let i = 0; i < labels.length; i++){
            let d = document.createElement("div");
            let symbol = sym[i];
            let label = labels[i];
            if(label == "<hr>"){
                d = document.createElement("hr");
                d.classList.add("ex");
            }
            else d.innerHTML = `<div style="min-width:20px;font-size:20px" class="material-symbols-outlined">${symbol||""}</div><div>${label}</div`;
            dd.appendChild(d);
            f(i,d);
        }
        dd.addEventListener("mouseover",e=>{
            overMenu = true;
        });
        dd.addEventListener("mouseleave",e=>{
            overMenu = false;
        });
        d_menus.appendChild(dd);
        d_menus.style.display = "initial";
        dd.style.left = rect.x+"px";
        dd.style.top = (rect.y+rect.height)+"px";
    });
}

let overMenu = false;
d_menus.addEventListener("mousedown",(e)=>{
    if(overMenu) return;
    closeMenu();
});
menu.addEventListener("mouseenter",()=>{
    overMenu = true;
});
menu.addEventListener("mouseleave",()=>{
    overMenu = false;
});

// @ts-ignore
let socket = io();
// let socket = io.connect();
// @ts-ignore
async function testSubmitFiles(){
    const [handle] = await showOpenFilePicker({
        types:[
            {
                accept:{
                    "image/*":[".png"]
                },
                description:"PNG Image"
            }
        ]
    });
    let file = await handle.getFile();
    console.log("NAME: ",file.name);
}

class OptionDiv{
    constructor(){}
    c:HTMLElement[]|HTMLInputElement[]|HTMLButtonElement[] = [];
    d:HTMLElement = null;
}
function EleHTML(e: string,html:string[]|string=[],append: HTMLElement,ops: {}={},on: Function=null,title: string=null){ //"div^hi there", title:"!cool option" (use ! for prev)
    let dd = new OptionDiv();
    let d = document.createElement(e);
    dd.d = d;
    if(html instanceof Array) for(let i = 0; i < html.length; i++){
        let s = html[i].split("^");
        let chars = ["!","@"];
        let type = s[0];
        for(let j = 0; j < chars.length; j++) type = type.replace(chars[j],"");
        let a = document.createElement(type);
        if(s[0].startsWith("!")) a.className = "prev";
        if(s[0].startsWith("@")) a.className = "dd";
        a.innerHTML = s[1];
        if(s[2]) for(let ar = s[2].split(","), i = 0; i < ar.length; i++) a.classList.add(ar[i]);
        if(s[3]) a.setAttribute("style",s[3]);
        dd.c[i] = a;
        d.appendChild(a);
        if(on) on(i,a);
    }
    else{
        d.innerHTML = html;
    }
    if(title){
        let t = document.createElement("div");
        if(title.startsWith("!")){
            t.className = "prev";
            title = title.substring(1,title.length);
        }
        t.textContent = title;
        if(append) append.appendChild(t);
    }
    if(append) append.appendChild(d);
    if(ops){
        // @ts-ignore
        if(ops.flex){
            d.style.display = "flex";
            d.style.alignItems = "center";
        }
        // @ts-ignore
        if(ops.sb) d.style.justifyContent = "space-between";
    }
    return dd;
}

let callIds = {};
function clearCallouts(){
    let l = document.getElementsByClassName("callout");
    for(let i = 0; i < l.length; i++){
        let a = l[i];
        a.parentNode.removeChild(a);
    }
    let l2 = Object.keys(callIds);
    for(const key of l2){
        let data = callIds[l2[0]];
        clearTimeout(data.tid);
        delete callIds[l2[0]];
    }
}
function makeCallout(a:HTMLElement,text:string,id:string){
    let call:HTMLElement;
    function end(){
        let tid = setTimeout(()=>{
            if(call) if(call.parentNode) call.parentNode.removeChild(call);
            delete callIds[id];
        },4000+text.length*10);
        callIds[id] = {
            tid,
            call
        };
    }
    if(callIds[id]){
        let data = callIds[id];
        clearTimeout(data);
        call = data.call;
        end();
        return;
    }
    
    call = document.createElement("div");
    call.className = "callout";
    call.innerHTML = text;
    d_menus.appendChild(call);

    let rect = a.getBoundingClientRect();
    let callRect = call.getBoundingClientRect();
    call.style.left = (rect.x)+"px";
    call.style.top = (rect.y-callRect.height-3)+"px";
    
    end();
}

class Menu{
    constructor(title:string,w:number,h:number){
        let t = this;
        t.title = title;
        t.w = w;
        t.h = h;
    }
    title:string;
    w:number;
    h:number;
    onload(d:HTMLElement){}
    open(){
        menu.style.display = "initial";
        (<HTMLElement>menu.parentNode).style.display = "initial";
        menu.style.width = this.w+"px";
        // menu.style.height = this.h+"px";
        let title = menu.querySelector(".l_title");
        title.textContent = this.title;
        menu.children[1].innerHTML = "";
        this.onload(<HTMLElement>menu.children[1]);
    }
}
const ex = ["/","\\",":","*","?",'"',"|","<",">"];
function isValidName(name:string){
    for(const s of ex){
        if(name.includes(s)) return false;
    }
    return true;
}
function createTable(a:HTMLElement,cols:string[][],widths:number[],onload:(d:HTMLElement,r:number,c:number)=>void=null){
    let tab = document.createElement("table");
    let exp:HTMLElement[][] = [];
    for(let i = 0; i < cols.length; i++){
        let tr = document.createElement("tr");
        tr.style.height = "35px";
        exp.push([]);
        let row = cols[i];
        for(let j = 0; j < row.length; j++){
            let ss = row[j].split("^")
            let type = ss[1];
            let s = ss[0];
            let td = document.createElement("td");
            if(type){
                let div:any = document.createElement(type);
                if(type == "input") div.type = s;
                else div.textContent = s;
                if(onload) onload(div,j,i);
                exp[i][j] = div;
                td.appendChild(div);
            }
            else{
                td.textContent = s;
                exp[i][j] = td;
            }
            tr.appendChild(td);
            if(j == 0) if(widths[j] != null) td.style.width = widths[j]+"px";
        }
        tab.appendChild(tr);
    }
    a.appendChild(tab);
    return exp;
}
class AddToMenu extends Menu{
    constructor(){
        super("Add File To Collection",400,0);
    }
    ref:ImgFile;
    async onload(d: HTMLElement){
        let file = this.ref;
        if(file.owner != me.uid) return;
        let coll:string = null;
        let l = EleHTML("div",[
            `div^Selected Collection:^^margin-right:10px;font-size:14px`,
            `div^No collection selected.^prev`
        ],d,{flex:true});
        
        let listDiv = document.createElement("div");
        listDiv.className = "listDiv";
        d.appendChild(listDiv);

        let confirm = document.createElement("button");
        confirm.textContent = "Confirm";
        confirm.onclick = function(){
            
        };

        let listStr:string = await getPropAsync(me.username,"colls");
        let list:string[][] = JSON.parse(listStr);
        for(let i = 0; i < list.length; i++){
            let [ind,name] = list[i];
            let dd = document.createElement("div");
            dd.textContent = name;
            dd.onclick = function(){
                coll = ind;
                l.c[1].textContent = name;
            };
            listDiv.appendChild(dd);
        }
    }
}
class UploadMenu extends Menu{
    constructor(){
        super("Upload File",400,0);
    }
    onload(d: HTMLElement): void {
        let button = document.createElement("button");
        let file:string = null;
        button.onclick = function(){
            
        };
        let tab = createTable(d,[
            ["File","Upload^button"],
            ["Title","text^input"],
            ["Description","text^input"],
            ["Speed (FPS)","text^input"],
            ["Cell Width","text^input"],
            // ["Cell Height","text^input"],
            ["","Submit^button"]
        ],[100]);
        let fileRef:File = null;
        let b_upload = tab[0][1];
        let i_title = <HTMLInputElement>tab[1][1];
        let i_desc = <HTMLInputElement>tab[2][1];
        let i_speed = <HTMLInputElement>tab[3][1];
        let i_w = <HTMLInputElement>tab[4][1];
        // let i_h = <HTMLInputElement>tab[5][1];
        let b_submit = tab[5][1];
        b_upload.onclick = async function(){
            const [handle] = await showOpenFilePicker({
                types:[
                    {
                        accept:{
                            "image/*":[".png"]
                        },
                        description:"PNG Image"
                    }
                ]
            });
            let file = await handle.getFile();
            // console.log(file);
            if(!file){
                b_upload.textContent = "Upload";
                return;
            }
            else b_upload.textContent = "[...]";
            fileRef = file;
        };
        b_submit.onclick = async function(){
            if(Number.isNaN(parseFloat(i_speed.value))) return;
            let aBuf = await fileRef.arrayBuffer();

            // let buf = Buffer.from(aBuf);
            let tmp = new Blob([new Uint8Array(aBuf)]);
            let url = URL.createObjectURL(tmp);
            let img = new Image();
            img.src = url;
            let [width,height] = await new Promise<number[]>(resolve=>{
                img.onload = function(){
                    resolve([img.width,img.height]);
                };
            });
            let frameAmt = width/parseFloat(i_w.value);
            if(frameAmt != Math.floor(frameAmt)){
                alert("Incorrect cell width");
                return;
            }
            socket.emit("uploadSS",fileRef.name,i_w.value,height,width,height,i_title.value,i_desc.value,{
                speed:i_speed.value
            },await fileRef.arrayBuffer(),async (fileId:string)=>{
                if(fileId == null){
                    alert("Error while uploading file");
                    return;
                }
                console.log("UPLOADED WITH ID: ",fileId);
                loadFile(fileId,area.children[1]);
                /*let fileData = await new Promise<string>(resolve=>{
                    socket.emit("getFile",fileId,0,str=>{
                        // console.log("STR: ",str);
                        resolve(str);
                    });
                });
                console.log(fileData);
                addFile(makeFile(fileData));*/
            });
            
            /*socket.emit("uploadFile",fileRef.name,await fileRef.text(),i_title.value,i_desc.value,{
                speed:i_speed.value
            },(data:string)=>{
                let dat:ImgFile = JSON.parse(data);
                addFile(dat,null);
            });*/
            /*const maxChunkLen = 120000; //20000
            let text = await fileRef.text();
            let amt = Math.ceil(text.length/maxChunkLen);
            
            socket.emit("initUploadFile",fileRef.name,amt,i_title.value,i_desc.value,{
                speed:i_speed.value
            },(fileId:number)=>{
                for(let i = 0; i < amt; i++){
                    socket.emit("uploadFile2",fileId,i,text.substring(i*maxChunkLen,(i+1)*maxChunkLen),(data:string)=>{
                        // let dat:ImgFile = JSON.parse(data);
                        // addFile(dat,null);
                        // console.log("FINISHED UPLOADING FILE",data);
                        let dat = JSON.parse(data);
                        addFile(dat,null);
                    });
                }
            });*/
            closeMenu();
        };
    }
}
class EditFileMenu extends Menu{
    constructor(){
        super("Edit File",400,0);
    }
    ref:ImgFile;
    onload(d: HTMLElement): void {
        let t = this;
        let tab = createTable(d,[
            ["Title","text^input"],
            ["Description","text^input"],
            ["Speed (FPS)","text^input"],
            ["","Update^button"]
        ],[100]);
        let i_title = <HTMLInputElement>tab[0][1];
        let i_desc = <HTMLInputElement>tab[1][1];
        let i_speed = <HTMLInputElement>tab[2][1];
        i_title.value = t.ref.title;
        i_desc.value = t.ref.desc;
        i_speed.value = t.ref.speed.toString();
        let b_submit = tab[3][1];
        b_submit.onclick = async function(){
            socket.emit("updateFile",{
                id:t.ref.id,
                title:i_title.value,
                desc:i_desc.value,
                speed:i_speed.value
            });
            t.ref = null;
            closeMenu();
        };
    }
}
class LogInMenu extends Menu{
    constructor(){
        super("Log In",400,0);
    }
    onload(d: HTMLElement): void {
        let par = <HTMLElement>d.parentNode;
        par.style.left = "unset";
        par.style.right = "20px";
        par.style.top = "40px";
        par.style.translate = "0px 0px";
        let tab = createTable(d,[
            ["Username","text^input"],
            ["Password","password^input"]
        ],[
            100
        ]);
        let i_username = <HTMLInputElement>tab[0][1];
        let i_pass = <HTMLInputElement>tab[1][1];
        let foot = EleHTML("div",[
            "button^Confirm^^width:120px;margin-left:auto"
        ],d,{
            flex:true
        });
        foot.c[0].onclick = function(){
            logIn(i_username.value,i_pass.value);
        };
    }
}
class SignUpMenu extends Menu{
    constructor(){
        super("Sign Up",400,0);
    }
    onload(d:HTMLElement):void{
        let par = <HTMLElement>d.parentNode;
        par.style.left = "unset";
        par.style.right = "20px";
        par.style.top = "40px";
        par.style.translate = "0px 0px";
        let tab = createTable(d,[
            ["Username","text^input"],
            ["Display Name","text^input"],
            ["Password","password^input"]
        ],[100],(d:HTMLInputElement,r,c)=>{
        });
        let i_username = <HTMLInputElement>tab[0][1];
        let i_displayName = <HTMLInputElement>tab[1][1];
        let i_pass = <HTMLInputElement>tab[2][1];
        i_username.oninput = function(){
            if(isValidName(i_username.value)){
                clearCallouts();
                i_username.classList.remove("wrong");
            }
            else{
                makeCallout(i_username,"Cannot contain these symbols: [ "+ex.join(", ")+" ]","badSymbols");
                i_username.classList.add("wrong");
            }
            // let abc = "abcdefghijklmnopqrstuvwxyz0123456789_-";
        };
        i_pass.oninput = function(){

        };
        //
        let foot = EleHTML("div",[
            "button^Confirm^^width:120px;margin-left:auto"
        ],d,{
            flex:true
        });
        foot.c[0].onclick = function(){
            socket.emit("createUser",i_username.value,i_displayName.value,i_pass.value,(err)=>{
                if(err){
                    alert("Failed to create user: "+err);
                    return;
                }
                console.log("Created user successfully!");
                closeMenu();
            });
        };
    }
}
const menus = {
    signUp:new SignUpMenu(),
    logIn:new LogInMenu(),
    upload:new UploadMenu(),
    edit:new EditFileMenu(),
    addTo:new AddToMenu()
};

function closeMenu(){
    (<HTMLElement>menu.parentNode).style.display = "none";
    menu.style.display = "none";
    if(document.activeElement) (<HTMLElement>document.activeElement).blur();
    for(let i = 0; i < d_menus.children.length; i++){
        let d = d_menus.children[i];
        if(d != menu){
            d_menus.removeChild(d);
            i--;
        }
    }
}

b_closeMenu.onclick = function(){
    closeMenu();
};

(<HTMLElement>d_acc.children[2]).onclick = function(){
    menus.signUp.open();
};
(<HTMLElement>d_acc.children[1]).onclick = function(){
    menus.logIn.open();
};
(<HTMLElement>d_acc.children[0]).onclick = function(){
    logOut();
};

m_acc.onclick = function(){
    // loadPanel("personal");
    location.search = "?"+me.username;
};

let me:User = null;

socket.on("loadUser",(userStr:string)=>{
    if(userStr == null){
        console.log("logged out successfully.");
        me = null;
        l_name.textContent = "No User";
        localStorage.removeItem("usrName");
        localStorage.removeItem("usrPass");
        location.reload();
        return;
    }
    let user = JSON.parse(userStr);
    console.log("loading user",user);
    me = user;
    l_name.textContent = user.name;
    // console.log("USER: ",user);
    d_acc.children[0].classList.remove("hide");
    d_acc.children[1].classList.add("hide");
    d_acc.children[2].classList.add("hide");
    let username = location.search.substring(1);
    loadPanel("personal",username);

    // if(!location.search) location.search = username;
    // loadPanel("personal",me.username);
});

function logOut(){
    console.log("logging out...");
    socket.emit("logOut");
}
function logIn(username:string,pass:string){
    socket.emit("logIn",username,pass,(err:string,id:number)=>{
        if(err){
            alert("Failed to log in: "+err);
            return;
        }
        console.log("Logged in successfully!");
        localStorage.setItem("usrName",username);
        localStorage.setItem("usrPass",pass);
        closeMenu();
        if(location.search.length <= 1){
            location.search = "?"+username;
        }
    });
}

if(localStorage.getItem("usrName") != null) logIn(localStorage.getItem("usrName"),localStorage.getItem("usrPass"));

//

interface CardDiv extends HTMLDivElement{
    ref:ImgFile;
    i:number;
    frame:number;
    speed:number;
    dat:any;
    pause:boolean;
    update:()=>void;

    slideRef:HTMLInputElement;
    playRef:HTMLElement;
}

function getPropAsync(username:string,prop:string){
    return new Promise<any>(resolve=>{
        socket.emit("getUserProps",username,prop,(data:any)=>{
            resolve(data);
        });
    });
}
function getFilePropAsync(fileId:string,prop:string){
    return new Promise<any>(resolve=>{
        socket.emit("getFileProps",fileId,prop,(data:any)=>{
            resolve(data);
        });
    });
}

interface CaretDiv extends HTMLDivElement{
    open:boolean;
}

let hoverCard:CardDiv = null;
let lastHoverCard:CardDiv = null;
let largeCard:CardDiv = null;
area.onclick = function(){
    if(hoverCard) return;
    if(!largeCard) return;
    largeCard.speed = largeCard.ref.speed/60;
    largeCard.pause = false;
    largeCard.classList.remove("large");
    largeCard = null;
    syncCards();
};

function makeFile(str:string){
    // console.log("MAKE FILE:",str);
    let obj = JSON.parse(str);
    return <ImgFile>obj;
    /*console.log("OBJ: ",obj);
    // let file = new ImgFile(null,null,null);
    let file = {};
    let ok = Object.keys(obj);
    for(const key of ok){
        if(ok[key]) file[key] = obj[key];
    }
    return <ImgFile>file;*/
}

async function loadFile(s:string,cont){
    s = s.toString();
    
    let file = [];
    let amt = await getFilePropAsync(s,"sect");
    for(let j = 0; j < amt; j++){
        file[j] = await new Promise<string>(resolve=>{
            socket.emit("getFile",s,j,str=>{
                resolve(str);
            });
        });
    }
    
    let div = await addFile(makeFile(file.join("")),cont);
    setTimeout(async function(){
        let buf = await new Promise<Buffer>(resolve=>{
            socket.emit("getSS",s,(data:Buffer)=>{
                resolve(data);
            });
        });
        let blob = new Blob([new Uint8Array(buf)]);
        let url = URL.createObjectURL(blob);
        let img = new Image(div.ref.w,div.ref.h);
        img.src = url;
        img.onload = function(){
            div.update();
        };
        div.ref.img = img;

        // syncCards();
    },0);
}

async function loadPanel(id:string,data2:string){
    area.innerHTML = "";
    if(id == "personal"){
        let username = data2;
        let exists:boolean = await getPropAsync(username,"exists");
        if(!exists){
            let div = document.createElement("div");
            div.textContent = `User "${username}" Does Not Exist`;
            div.className = "DNE";
            area.appendChild(div);
            console.warn("ERR: username doesn't exit")
            return;
        }
        let isOther = (data2 != me?.username);
        if(!isOther) l_title2.innerHTML = "<div class='material-symbols-outlined'>chevron_right</div><div>Personal</div>";
        else{
            socket.emit("getUserProps",data2,"name",(name:string)=>{
                l_title2.innerHTML = `<div class='material-symbols-outlined'>chevron_right</div><div>${name}'s Files</div>`;
            });
        }

        let mainTxt = (!isOther ? "All Files" : "All Public Files");
        // let sects = [mainTxt,"Likes"]; //likes is temporary for testing
        let dList:HTMLElement[] = [];
        // if(false) for(let i = 0; i < sects.length; i++){
            // dList.push(document.createElement("div"));
        // }
        let data = await new Promise<string>(resolve=>{
            socket.emit("getUserData",username,async (data:string)=>{
                resolve(data);
            });
        });
        /**{
            username:string,
            name:string,
            files:string[]
        } */
        let user:User = JSON.parse(data);
        console.log("USER: ",user);
        console.log("LOADED USER: ",user);
        async function loadSect(txt:string,type:string,atr:any=null){
            dList.push(document.createElement("div"));

            let head = document.createElement("div");
            head.setAttribute("style","display:flex;align-items:center;gap:20px");
            let d = document.createElement("div");
            d.textContent = txt;
            d.style.whiteSpace = "nowrap";
            let cont = document.createElement("div");
            cont.className = "cards";
            cont.id = "cardCont";
            let car = <CaretDiv>document.createElement("div");
            car.className = "material-symbols-outlined";
            car.classList.add("caret");
            car.textContent = "chevron_right";
            head.appendChild(car);
            head.appendChild(d);
            let fillLine = document.createElement("div");
            fillLine.className = "fillLine";
            head.appendChild(fillLine);
            
            if(type == "allFiles"){
                let add:HTMLElement;
                if(!isOther){
                    add = document.createElement("div");
                    add.innerHTML = "<button>Upload</button>";
                    add.style.marginLeft = "auto";
                    head.appendChild(add);
                }

                if(!isOther) (<HTMLElement>add.children[0]).onclick = function(){
                    uploadFile();
                };
            }
            area.appendChild(head);
            area.appendChild(cont);

            car.open = false;
            car.onclick = async function(){
                car.open = !car.open;
                // car.style.rotate = (car.open?"90deg":"0deg");
                if(car.open) car.classList.add("open");
                else car.classList.remove("open");
                if(car.open){
                    //loadFile
                    async function loadFileSect(filesStr:string){
                        user.files = JSON.parse(filesStr);
                        for(let i = 0; i < user.files.length; i++){
                            let s = user.files[i];
                            await loadFile(s,cont);
                        }
                    }
                    if(type == "allFiles"){
                        let filesStr = await getPropAsync(username,"allFiles");
                        console.log("FSTR",filesStr);
                        await loadFileSect(filesStr);
                    }
                    else if(type == "likes"){
                        let filesStr:string = await getPropAsync(username,"likes");
                        await loadFileSect(filesStr);
                        /*let likesStr:string = await getPropAsync(username,"likes");
                        let likes = JSON.parse(likesStr);
                        if(!likes){
                            
                        }
                        else for(let i = 0; i < likes.length; i++){
                            let file:ImgFile = await new Promise<ImgFile>(resolve=>{
                                socket.emit("getFile",user.uid,likes[i],(data1:string)=>{
                                    let file:ImgFile = JSON.parse(data1);
                                    resolve(file);
                                });
                            });
                            addFile(file,cont);
                        }*/
                    }
                    else if(type == "pub"){
                        let files = await getPropAsync(username,"pub");
                        await loadFileSect(JSON.stringify(files));
                        /*let l:string[] = await getPropAsync(username,"pub");
                        for(let i = 0; i < l.length; i++){
                            let file:ImgFile = await new Promise<ImgFile>(resolve=>{
                                socket.emit("getFile",user.uid,l[i],(data1:string)=>{
                                    let file:ImgFile = JSON.parse(data1);
                                    resolve(file);
                                });
                            });
                            addFile(file,cont);
                        }*/
                    }
                    else if(type == "coll"){
                        console.log("loaded coll: ",atr);
                    }
                    return;
                }
                cont.innerHTML = "";
            };
        }
        if(me) if(username == me.username) loadSect(mainTxt,"allFiles");

        //likes
        socket.emit("testUserProps",username,"likes",(val:boolean)=>{
            if(val) loadSect("Likes","likes");
        });
        loadSect("Public Files","pub");

        //collections
        let colls = await new Promise<string[][]>((resolve)=>{
            socket.emit("getUserProps",username,"colls",(data)=>{
                resolve(JSON.parse(data));
            });
        });
        for(let i = 0; i < colls.length; i++){
            let c = colls[i];
            loadSect(c[1],"coll",c[0]);
        }

        if(area.children[0].children[0]) (<HTMLButtonElement>area.children[0].children[0]).click();
    }
}

async function testUploadPNG(){
    const [handle] = await showOpenFilePicker({
        types:[
            {
                accept:{
                    "image/*":[".png"]
                },
                description:"PNG Image"
            }
        ]
    });
    let file = await handle.getFile();
    socket.emit("uploadPNG",file.name,await file.arrayBuffer());
}
function testGetPNG(){
    let start = performance.now();
    socket.emit("getPNG","",(buf:Buffer)=>{
        console.log("GOT BUFFER");
        let blob = new Blob([new Uint8Array(buf)]);
        let url = URL.createObjectURL(blob);
        let img = new Image(256,256);
        img.src = url;
        document.body.appendChild(img);
        console.log("ADDED in ",performance.now()-start);
    });
}
function getNames(uid:string){
    return new Promise<string[]>(resolve=>{
        socket.emit("getNames",uid,(un:string,n:string)=>{
            resolve([un,n]);
        });
    });
}

function syncCards(){
    let list = document.querySelectorAll<CardDiv>(".card");
    for(let j = 0; j < list.length; j++){
        let card = list[j];
        for(let i = j+1; i < list.length; i++){
            let a = list[i];
            if(a.ref.id == card.ref.id){
                card.ref = a.ref;
                card.speed = a.speed;
                card.frame = a.frame;
                a.i = 0;
                card.i = a.i;
                break;
            }
        }
    }
}

async function addFile(file:ImgFile,par:HTMLElement=null,scale=1){
    // console.log("FILE",file);
    let card:CardDiv = <CardDiv>document.createElement("div");
    card.i = 1;
    card.frame = 0;
    card.speed = file.speed/60;
    card.pause = false;
    card.className = "card";

    let cont = document.getElementById("cardCont");
    if(!par) par = cont;
    if(par.previousElementSibling.children[0].classList.contains("open")) par.appendChild(card);
    let can = document.createElement("canvas");
    can.className = "can";
    can.style.aspectRatio = (file.w/file.h).toString();
    let rat = file.w/file.h;
    can.style.width = (rat*100)+"%";
    // can.style.width = (Math.min(130,130*rat))+"px";
    if(rat > 1){
        can.style.marginTop = `${100-1/rat*100}%`;
        can.style.translate = `0px -${100-1/rat*100}%`;
        can.style.height = "initial";
    }
    else if(rat < 1){
        can.style.marginLeft = `${rat*100}%`;
        can.style.translate = `-${rat*100}% 0px`;
        can.style.height = "100%";
    }
    let ctx = can.getContext("2d");
    let canCont = document.createElement("div");
    canCont.className = "canCont";
    canCont.appendChild(can);
    card.appendChild(canCont);
    let ops = document.createElement("div");
    ops.className = "ops";
    card.onmouseenter = function(){
        hoverCard = card;
        lastHoverCard = card;
    };
    card.onmouseleave = function(){
        hoverCard = null;
    };
    createDropdown(ops,[
        "Edit",
        "Add to...",
        "Favorite",
        "Make Public",
        "<hr>",
        "Delete",
    ],[
        "edit",
        "add",
        "favorite",
        "public",
        null,
        "delete"
    ],(i,d)=>{
        if(i == 2){
            if(card.ref.likes.includes(me.uid)){
                d.children[1].textContent = "Unfavorite";
                d.children[0].classList.add("fill");
            }
        }
        if(i == 3){
            socket.emit("getFileProps",card.ref.id,"pub",val=>{
                if(val){
                    d.children[1].textContent = "Make Private";
                    d.children[0].textContent = "security";
                }
            });
        }
        d.onclick = function(){
            closeMenu();
            if(i == 0){
                menus.edit.ref = card.ref;
                menus.edit.open();
            }
            else if(i == 1){ //add to collection
                alert("WIP");
                // menus.addTo.ref = card.ref;
                // menus.addTo.open();
            }
            else if(i == 2){ //like file
                socket.emit("likeImage",card.ref.owner,card.ref.id);
            }
            else if(i == 3){ //toggle pub
                console.log("set pub");
                socket.emit("setFilePub",card.ref.id,!card.ref.pub);
            }
            else if(i == 5){ //delete file
                socket.emit("deleteFile",card.ref.id,()=>{
                    removeFile(me.uid,card.ref.id);
                });
            }
        };
    });
    ops.className = "material-symbols-outlined";
    ops.classList.add("ops");
    ops.textContent = "more_horiz";
    card.appendChild(ops);
    let props = document.createElement("div");
    props.className = "s-wrapper";
    props.classList.add("props");
    //gen props
    props.appendChild(document.createElement("hr"));
    let prop1 = EleHTML("div",[
        // `div^`,
        `div^<span style='margin-right:10px' class='material-symbols-outlined'>ads_click</span><span>0</span>^flexc^opacity:0.4`,
        `div^<span style='margin-right:10px'>0</span><span class='material-symbols-outlined'>favorite</span>^flexc`
    ],props);
    prop1.d.className = "prop1";
    prop1.d.style.marginBottom = "5px";
    //
    let filenameS = file.name.split(".");
    filenameS.pop();
    // let filename = filenameS.join(".");
    // let [fileUUN,fileUN] = await getNames(file.owner);
    getNames(file.owner).then(([fileUUN,fileUN])=>{
        // console.log(fileUUN,fileUN);
        prop2.c[1].children[0].textContent = "- "+fileUN+" ";
        prop2.c[1].children[1].textContent = "("+fileUUN+")";
    });
    /*let prop2 = EleHTML("div",[
        `div^${file.title||filename}^^font-size:14px;margin-bottom:5px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden`,
        `div^- ${fileUN} <span class="prev">(${fileUUN})</span>^prev^font-size:12px;margin-bottom:0px`,
    ],props);*/
    let prop2 = EleHTML("div",[
        `div^-- . --^^font-size:14px;margin-bottom:5px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden`,
        `div^<span>- -- . -- </span><span class="prev">(-.-)</span>^prev^font-size:12px;margin-bottom:0px`,
    ],props);
    prop2.c[0].textContent = file.title || file.name;
    prop1.d.parentElement.appendChild(prop1.d);
    // props.appendChild(document.createElement("hr"));
    //
    card.appendChild(props);

    ////extra props

    let prop3 = EleHTML("div",[
        `div^${file.desc}^prev^font-size:14px;margin-top:10px`
    ],props);
    prop3.d.classList.add("prop3");
    
    let propMed = EleHTML("div",[
        `div^pause^material-symbols-outlined`,
        `div^<input> FPS`,
        `div^<input> <span>0</span>^flexc^gap:5px`
    ],props);
    propMed.d.classList.add("propMed");
    let ct_play = <HTMLElement>propMed.c[0];
    let ct_speed = <HTMLInputElement>propMed.c[1].children[0];
    let ct_range = <HTMLInputElement>propMed.c[2].children[0];
    ct_speed.value = file.speed.toString();

    ////

    if(scale != 1){
        card.style.scale = scale.toString();
    }

    prop1.c[0].children[1].textContent = file.views.length.toString();
    prop1.c[1].children[0].textContent = file.likes.length.toString();
    card.ref = file;
    if(me) if(file.likes.includes(me.uid)) prop1.c[1].children[1].classList.add("fill");
    (<HTMLElement>prop1.c[1].children[1]).onclick = function(){
        if(me) socket.emit("likeImage",file.owner,file.id);
    };

    canCont.onclick = function(){
        if(largeCard){
            largeCard.speed = largeCard.ref.speed/60;
            largeCard.pause = false;
            largeCard.classList.remove("large");
            largeCard = null;
            syncCards();
        }
        card.classList.add("large");
        ct_speed.value = (card.speed*60).toString();
        largeCard = card;
        socket.emit("clickFile",file.id);
    };

    function loadNBG(str:string,frameI:number=0){
        let nbg = {
            name:"",
            w:0,
            h:0,
            size:0,
            palette:<number[][]>[],
            frames:[]
        };
        if(!card.dat) card.dat = nbg;
        let sects = str.split("@");
        // console.log(sects);

        for(let i = 0; i < sects.length; i++){
            let sect = sects[i].trim();
            let ops = sect.split("\n");
            for(let j = 0; j < ops.length; j++){
                ops[j] = ops[j].trim();
            }
            if(!ops[0]) continue;
            if(i == 0){
                let list = ops[0].split(",");
                nbg.name = list[0];
                nbg.w = parseInt(list[1]);
                nbg.h = parseInt(list[2]);
                can.width = nbg.w;
                can.height = nbg.h;
                // console.log(ops);
                let palList = ops[2].split(",");
                for(let j = 0; j < palList.length; j++){
                    let col = palList[j];
                    let r = parseInt(col.substring(0,2),16);
                    let g = parseInt(col.substring(2,4),16);
                    let b = parseInt(col.substring(4,6),16);
                    let a = 255;
                    if(col.length > 6) a = parseInt(col.substring(6,8),16);
                    nbg.palette.push([r,g,b,a]);
                }
                nbg.size = nbg.w*nbg.h*4;
                continue;
            }
            else if(ops[0] == "layer"){
                // console.log("loading layer...");
                let op1 = ops[1].split(",");
                let layerI = parseInt(op1[0]);
                let frameI = parseInt(op1[1]);
                let name = ops[2];
                let bufS = ops[3];
                let buf = new Uint8ClampedArray(nbg.size);
                function calcBuf(){
                    let blocks = bufS.split(";");
                    for(let j = 0; j < blocks.length; j++){
                        let block = blocks[j];
                        let ids = block.split(":");
                        let cId = parseInt(ids[0]);
                        let col = nbg.palette[cId];
                        let list = ids[1].split(",");
                        for(let k = 0; k < list.length; k++){
                            let ind36 = list[k];
                            let ind = parseInt(ind36,36)*4;
                            buf[ind] = col[0];
                            buf[ind+1] = col[1];
                            buf[ind+2] = col[2];
                            buf[ind+3] = col[3];
                        }
                    }
                }
                calcBuf();

                let visible = ops[4];
                if(!nbg.frames[frameI]) nbg.frames[frameI] = {
                    layers:[]
                };
                nbg.frames[frameI].layers.push({
                    name,visible,layerI,frameI,buf
                });
            }
        }
        //clean up
        let nob = new NobsinCtx(ctx);
        nob.updateStart();
        // for(let i = 0; i < nbg.frames.length; i++){
            let i = frameI;
            let frame = nbg.frames[i];
            // if(!frame) continue;
            if(frame) for(let j = 0; j < frame.layers.length; j++){
                let layer = frame.layers[j];
                if(!layer) continue;
                if(layer.visible == "false") continue;
                // ctx.putImageData(new ImageData(layer.buf,nbg.w,nbg.h),0,0);
                nob.drawImage_basic({
                    loaded:true,
                    w:nbg.w,
                    h:nbg.h,
                    data:layer.buf
                },0,0);
            }
        // }
        nob.updateEnd();
        return nbg;
        // ctx.putImageData(new ImageData(nob.buf,nbg.w,nbg.h),0,0);
        // console.log("LOADED NBG: ",nbg);
    }
    
    // card.textContent = file.name;
    ///////// let img = loadNBG(file.data);
    card.update = function(){
        if(!card.ref.img) return;
        let ref = card.ref;
        can.width = ref.w;
        can.height = ref.h;
        let x = ref.w*card.frame;
        ctx.drawImage(card.ref.img,x,0,ref.w,ref.h,0,0,ref.w,ref.h);
        // card.appendChild(card.ref.img);

        // loadNBG(file.data,card.frame);
        // console.log("UPDATE CALLED");
        ///////// loadNBG(card.ref.data,card.frame);
    };

    //

    ct_speed.type = "text";
    ct_speed.style.width = "40px";
    function ct_speed_update(){
        let val = parseInt(ct_speed.value);
        if(Number.isNaN(val)){
            ct_speed.value = "8";
            val = 8;
        }
        card.speed = val/60;
    }
    ct_speed.onblur = function(){
        ct_speed_update();
    };
    ct_speed.onkeydown = function(e){
        if(e.key.toLowerCase() == "enter"){
            ct_speed_update();
        }
    };
    card.playRef = ct_play;
    function updatePlay(){
        if(card.pause) ct_play.textContent = "play_arrow";
        else ct_play.textContent = "pause";
    }
    ct_play.onclick = function(){
        card.pause = !card.pause;
        updatePlay();
    };
    card.slideRef = ct_range;
    ct_range.type = "range";
    ct_range.step = "1";
    ct_range.min = "0";
    ct_range.max = (card.ref.frameAmt-1).toString();
    // ct_range.max = (img.frames.length-1).toString();
    ct_range.style.width = "100px";
    (<HTMLElement>ct_range.nextElementSibling).style.width = "25px";
    let wasPaused = false;
    ct_range.onmousedown = function(){
        wasPaused = card.pause;
        card.pause = true;
        updatePlay();
    };
    ct_range.onmouseup = function(){
        card.pause = wasPaused;
        updatePlay();
    };
    ct_range.oninput = function(){
        card.frame = parseInt(ct_range.value);
        ct_range.nextElementSibling.textContent = (card.frame+1).toString();
    };

    syncCards();

    return card;
}
async function uploadFile(){
    menus.upload.open();
    /*const [handle] = await showOpenFilePicker({
        types:[
            {
                accept:{
                    "image/*":[".nbg"]
                },
                description:"Nobsin Graphic"
            }
        ]
    });
    let file = await handle.getFile();
    socket.emit("uploadFile",file.name,await file.text(),(data:string)=>{
        let dat:ImgFile = JSON.parse(data);
        addFile(dat,null);
    });*/
}
async function getFile(username:string,num:number){
    socket.emit("getFile",username,num,(data:string)=>{
        let d = JSON.parse(data);
        console.log("RETREIVED FILE");
        console.log(d);
    });
}

if(!localStorage.getItem("usrName")) if(location.search){
    let username = location.search.substring(1);
    loadPanel("personal",username);
}

socket.on("updateImage",(uid,fileId,filestr:string)=>{
    let file:ImgFile = JSON.parse(filestr);
    let l = document.getElementsByClassName("card");
    for(let i = 0; i < l.length; i++){
        let c = <CardDiv>l[i];
        if(c.ref) if(c.ref.owner == uid && c.ref.id == fileId){
            updateImage(c,file);
            // break;
        }
    }
});

function updateImage(d:CardDiv,file:ImgFile){
    let prop1 = d.querySelector<HTMLElement>(".prop1");
    let view = <HTMLElement>prop1.children[0];
    let like = <HTMLElement>prop1.children[1];
    view.children[1].textContent = file.views.length.toString();
    like.children[0].textContent = file.likes.length.toString();
    if(me){
        if(file.likes.includes(me.uid)) like.children[1].classList.add("fill");
        else like.children[1].classList.remove("fill");
    }
    let img = d.ref.img;
    d.ref = file;
    d.ref.img = img;
    d.speed = file.speed/60;
    (<HTMLInputElement>prop1.nextElementSibling.nextElementSibling.children[1].children[0]).value = file.speed.toString();
    prop1.previousElementSibling.children[0].textContent = d.ref.title||d.ref.name;
    prop1.nextElementSibling.children[0].textContent = d.ref.desc;
}
function removeFile(uid:string,fileId:number){
    let l = document.getElementsByClassName("card");
    for(let i = 0; i < l.length; i++){
        let c = <CardDiv>l[i];
        if(c.ref.owner == uid && c.ref.id == fileId){
            c.parentNode.removeChild(c);
        }
    }
}

function update(){
    requestAnimationFrame(update);

    let l = document.querySelectorAll<CardDiv>(".card");
    for(let i = 0; i < l.length; i++){
        let a = l[i];
        if(!a) continue;
        if(a.ref.frameAmt <= 1) continue;
        // if(a.dat.frames.length <= 1) continue;
        // a.i += a.speed;
        // a.frame = Math.floor(a.i);
        if(!a.pause){
            a.i -= a.speed;
            if(a.i >= 2){
                a.i = 1;
                a.slideRef.value = a.frame.toString();
                a.slideRef.nextElementSibling.textContent = (a.frame+1).toString();
                a.frame--;
                if(a.frame < 0) a.frame = a.ref.frameAmt-1;
            }
            if(a.i <= 0){
                a.i = 1;
                a.slideRef.value = a.frame.toString();
                a.slideRef.nextElementSibling.textContent = (a.frame+1).toString();
                a.frame++;
                if(a.frame >= a.ref.frameAmt) a.frame = 0;
            }
        }
        a.update();
    }
}
update();

////////

// LZW-compress a string
function lzw_encode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i=1; i<data.length; i++) {
        currChar=data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase=currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i=0; i<out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

// Decompress an LZW-encoded string
function lzw_decode(s) {
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i=1; i<data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        }
        else {
           phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
}

async function testGetFile(){
    let start = performance.now();
    let h = await fetch("Lightsaber.nbg");
    let text = await h.text();
    // console.log("LOADED FILE: ",text);
    console.log("LOAD TIME: ",performance.now()-start);
}
// testGetFile();