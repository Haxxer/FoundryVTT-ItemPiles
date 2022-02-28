import {CONSTANTS, SOCKET_HANDLERS} from "./constants.js";
import API from "./api.js";
import {ItemPileInventory} from "./formapplications/inventory/item-pile-inventory.js";
import chatHandler from "./chathandler.js";
import {TradeAPI} from "./trade-api.js";
import {TradingApp} from "./formapplications/trading-app.js";
import {debug, getUuid, is_UUID} from "./lib/utils";

export let itemPileSocket;

export function registerSocket() {
    debug("Registered itemPileSocket");
    itemPileSocket = socketlib.registerModule(CONSTANTS.MODULE_NAME);

    /**
     * Generic socket
     */
    itemPileSocket.register(SOCKET_HANDLERS.CALL_HOOK, (hook, ...args) => callHook(hook, ...args))

    /**
     * Chat sockets
     */
    itemPileSocket.register(SOCKET_HANDLERS.PICKUP_CHAT_MESSAGE, (...args) => chatHandler._outputPickupToChat(...args))
    itemPileSocket.register(SOCKET_HANDLERS.SPLIT_CHAT_MESSAGE, (...args) => chatHandler._outputSplitToChat(...args))

    /**
     * Item pile sockets
     */
    itemPileSocket.register(SOCKET_HANDLERS.CREATE_PILE, (...args) => API._createItemPile(...args))
    itemPileSocket.register(SOCKET_HANDLERS.UPDATE_PILE, (...args) => API._updateItemPile(...args))
    itemPileSocket.register(SOCKET_HANDLERS.UPDATED_PILE, (...args) => API._updatedItemPile(...args))
    itemPileSocket.register(SOCKET_HANDLERS.DELETE_PILE, (...args) => API._deleteItemPile(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TURN_INTO_PILE, (...args) => API._turnTokensIntoItemPiles(...args))
    itemPileSocket.register(SOCKET_HANDLERS.REVERT_FROM_PILE, (...args) => API._revertTokensFromItemPiles(...args))
    itemPileSocket.register(SOCKET_HANDLERS.REFRESH_PILE, (...args) => API._refreshItemPile(...args))
    itemPileSocket.register(SOCKET_HANDLERS.SPLIT_PILE, (...args) => API._splitItemPileContents(...args))

    /**
     * UI sockets
     */
    itemPileSocket.register(SOCKET_HANDLERS.RENDER_INTERFACE, (...args) => API._renderItemPileInterface(...args))
    itemPileSocket.register(SOCKET_HANDLERS.RERENDER_PILE_INVENTORY, (...args) => API._updateItemPileInventoryApplication(...args))
    itemPileSocket.register(SOCKET_HANDLERS.QUERY_PILE_INVENTORY_OPEN, (...args) => isPileInventoryOpenForOthers.respond(...args))
    itemPileSocket.register(SOCKET_HANDLERS.RESPOND_PILE_INVENTORY_OPEN, (...args) => isPileInventoryOpenForOthers.handleResponse(...args))

    /**
     * Item & attribute sockets
     */
    itemPileSocket.register(SOCKET_HANDLERS.DROP_ITEMS, (args) => API._dropItems(args))
    itemPileSocket.register(SOCKET_HANDLERS.ADD_ITEMS, (...args) => API._addItems(...args))
    itemPileSocket.register(SOCKET_HANDLERS.REMOVE_ITEMS, (...args) => API._removeItems(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TRANSFER_ITEMS, (...args) => API._transferItems(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TRANSFER_ALL_ITEMS, (...args) => API._transferAllItems(...args))
    itemPileSocket.register(SOCKET_HANDLERS.ADD_ATTRIBUTE, (...args) => API._addAttributes(...args))
    itemPileSocket.register(SOCKET_HANDLERS.REMOVE_ATTRIBUTES, (...args) => API._removeAttributes(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TRANSFER_ATTRIBUTES, (...args) => API._transferAttributes(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TRANSFER_ALL_ATTRIBUTES, (...args) => API._transferAllAttributes(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TRANSFER_EVERYTHING, (...args) => API._transferEverything(...args))

    /**
     * Trading sockets
     */
    itemPileSocket.register(SOCKET_HANDLERS.TRADE_REQUEST_PROMPT, (...args) => TradeAPI._respondPrompt(...args));
    itemPileSocket.register(SOCKET_HANDLERS.TRADE_REQUEST_CANCELLED, (...args) => TradeAPI._tradeCancelled(...args));

    itemPileSocket.register(SOCKET_HANDLERS.PUBLIC.TRADE_UPDATE_ITEMS, (...args) => TradingApp._updateItems(...args));
    itemPileSocket.register(SOCKET_HANDLERS.PUBLIC.TRADE_UPDATE_CURRENCIES, (...args) => TradingApp._updateCurrencies(...args));
    itemPileSocket.register(SOCKET_HANDLERS.PUBLIC.TRADE_STATE, (...args) => TradingApp._setAcceptedState(...args));

    itemPileSocket.register(SOCKET_HANDLERS.PRIVATE.TRADE_UPDATE_ITEMS, (...args) => TradeAPI._updateItems(...args));
    itemPileSocket.register(SOCKET_HANDLERS.PRIVATE.TRADE_UPDATE_CURRENCIES, (...args) => TradeAPI._updateCurrencies(...args));
    itemPileSocket.register(SOCKET_HANDLERS.PRIVATE.TRADE_STATE, (...args) => TradeAPI._setAcceptedState(...args));

    itemPileSocket.register(SOCKET_HANDLERS.TRADE_CLOSED, (...args) => TradingApp._tradeClosed(...args));

    itemPileSocket.register(SOCKET_HANDLERS.TRADE_COMPLETED, (...args) => {
        TradingApp._tradeCompleted(...args)
        TradeAPI._tradeCompleted(...args)
    });

    itemPileSocket.register(SOCKET_HANDLERS.TRADE_SPECTATE, (...args) => TradeAPI._spectateTrade(...args));

    itemPileSocket.register(SOCKET_HANDLERS.DISABLE_CHAT_TRADE_BUTTON, (...args) => chatHandler._disableTradingButton(...args));
}

async function callHook(inHookName, ...args) {
    const newArgs = [];
    for (let arg of args) {
        if (is_UUID(arg)) {
            const testArg = await fromUuid(arg);
            if (testArg) {
                arg = testArg;
            }
        }
        newArgs.push(arg);
    }
    return Hooks.callAll(inHookName, ...newArgs);
}

export const isPileInventoryOpenForOthers = {

    query(inPile) {
        const promise = new Promise(resolve => {
            this.resolve = resolve;
        });

        this.usersToRespond = new Set(game.users
            .filter(user => user.active && user !== game.user)
            .map(user => user.id));
        this.isOpen = false;

        itemPileSocket.executeForOthers(SOCKET_HANDLERS.QUERY_PILE_INVENTORY_OPEN, game.user.id, getUuid(inPile));

        if (this.usersToRespond.size > 0) {
            setTimeout(this.resolve, 200);
        } else {
            this.resolve(false);
            this.usersToRespond = new Set();
            this.isOpen = false;
            this.resolve = () => {
            };
        }

        return promise;
    },

    async respond(inUserId, inPileUuid) {
        const app = ItemPileInventory.getActiveAppFromPile(inPileUuid);
        return itemPileSocket.executeAsUser(SOCKET_HANDLERS.RESPOND_PILE_INVENTORY_OPEN, inUserId, game.user.id, !!app);
    },

    handleResponse(inUserId, appOpen) {
        this.usersToRespond.delete(inUserId);
        this.isOpen = this.isOpen || appOpen;
        if (this.usersToRespond.size > 0) return;
        this.resolve(this.isOpen);
        this.usersToRespond = new Set();
        this.isOpen = false;
        this.resolve = () => {
        };
    }

}