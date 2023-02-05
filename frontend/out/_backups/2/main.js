"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var menu = document.getElementById("menu");
var d_acc = document.getElementById("d_acc");
// @ts-ignore
var socket = io();
var Menu = /** @class */ (function () {
    function Menu(title, w, h) {
        var t = this;
        t.title = title;
        t.w = w;
        t.h = h;
    }
    Menu.prototype.onload = function () { };
    Menu.prototype.open = function () {
        menu.style.display = "initial";
        menu.style.width = this.w + "px";
        menu.style.width = this.h + "px";
        var title = menu.querySelector(".l_title");
        title.textContent = this.title;
    };
    return Menu;
}());
var SignUpMenu = /** @class */ (function (_super) {
    __extends(SignUpMenu, _super);
    function SignUpMenu() {
        return _super.call(this, "Sign Up", innerWidth / 2, innerWidth / 2 * 0.75) || this;
    }
    SignUpMenu.prototype.onload = function () {
    };
    return SignUpMenu;
}(Menu));
var menus = {
    signUp: new SignUpMenu()
};
d_acc.children[2].onclick = function () {
    menus.signUp.open();
};
