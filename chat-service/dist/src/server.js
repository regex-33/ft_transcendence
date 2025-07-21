"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const messageHandler_1 = require("./handlers/messageHandler");
const server = new ws_1.WebSocketServer({ port: 8080 });
server.on('connection', (ws) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('New connection');
    yield (0, messageHandler_1.loadOldMessages)(ws);
    ws.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, messageHandler_1.handleMessage)(msg.toString(), ws);
    }));
}));
