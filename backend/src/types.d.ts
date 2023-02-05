declare interface Account{
    
}

declare class ImgFile{
    constructor(name:string,data:string,owner:string);
    name:string;
    data:string;
    owner:string;
    views:string[];
    likes:string[];
    title:string;
    desc:string;
    comments:string[];
    id:number;
    speed:number;
    delay:number;
    pub:boolean;
    save();
}

declare class Collection{
    constructor(name:string,desc:string,arr:string[]);
    name:string;
    desc:string;
    arr:string[];
}
declare class User{
    constructor(uid:string,username:string,name:string,pass:string);
    username:string;
    name:string;
    pass:string;
    uid:string;
    sockets:string[];
    files:string[];
    fileNum:number;
    dateJoined:string;
    lastOnline:string;
    friends:string[];
    collections:Collection[];
    likes:string[];
    save():void;
}

export { Account, ImgFile, User, Collection };