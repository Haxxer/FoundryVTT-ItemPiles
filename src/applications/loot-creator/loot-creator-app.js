import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import LootCreatorDialogShell from "./loot-creator-app-shell.svelte";

export default class LootCreatorApp extends SvelteApplication {

  constructor(options) {
    super({
      title: game.i18n.localize("ITEM-PILES.Applications.LootCreator.Title"),
      id: "item-piles-loot-creator",
      svelte: {
        class: LootCreatorDialogShell,
        target: document.body
      },
      close: () => this.options.resolve?.(null),
      ...options
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 550,
      height: 450,
      classes: ["item-piles-app"],
      resizable: true
    })
  }

  static getActiveApp() {
    return Object.values(ui.windows).find(app => app.id === `item-pile-loot-creator`);
  }

  static async show(options = {}) {
    const app = this.getActiveApp();
    if (app) {
      return app.render(false, { focus: true });
    }
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(options).render(true, { focus: true });
    })
  }

}
