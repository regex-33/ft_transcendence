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
exports.loadOldMessages = loadOldMessages;
exports.handleMessage = handleMessage;
const db_1 = require("../db");
function loadOldMessages(ws) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield db_1.pool.query('SELECT content FROM messages ORDER BY created_at ASC');
        res.rows.forEach(row => {
            ws.send(row.content);
        });
    });
}
function handleMessage(msg, ws) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db_1.pool.query('INSERT INTO messages (content) VALUES ($1)', [msg]);
        ws.send(msg);
    });
}
