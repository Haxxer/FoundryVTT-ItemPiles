import {TJSDialog} from '@typhonjs-fvtt/runtime/svelte/application';

import CurrenciesEditorShell from './currencies-editor.svelte';
import {CONSTANTS} from "../../../constants";

export default class CurrenciesEditor extends TJSDialog {

    constructor(data = false, options, dialogData = {}) {
        const currencies = data || game.settings.get(CONSTANTS.MODULE_NAME, "currencies");
        const primary_currency = currencies.indexOf(currencies.find(currency => currency.primary));
        super({
            ...dialogData,
            title: game.i18n.localize("ITEM-PILES.CurrenciesEditor.Title"),
            zIndex: 102,
            content: {
                class: CurrenciesEditorShell,
                props: {
                    primary_currency,
                    currencies
                }
            },
            buttons: {
                save: {
                    icon: 'fas fa-save',
                    label: "ITEM-PILES.CurrenciesEditor.Submit",
                    onclick: "requestSubmit"
                },
                no: {
                    icon: 'fas fa-times',
                    label: 'Cancel',
                    onclick: () => {
                        this.options.resolve?.(false);
                        this.close();
                    }
                }
            },
            default: 'save',
            autoClose: false, // Don't automatically close on button onclick.
            close: () => this.options.resolve?.(null)
        }, {width: 630, height: "auto", ...options});
    }

    static async show(data = false, options = {}, dialogData = {}) {
        return new Promise((resolve) => {
            if (data) options.resolve = resolve;
            new this(data, options, dialogData).render(true);
        })
    }

    submit(data) {
        return game.settings.set(CONSTANTS.MODULE_NAME, "currencies", data);
    }
}