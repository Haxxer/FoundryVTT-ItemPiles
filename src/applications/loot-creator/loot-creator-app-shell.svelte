<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
  import * as Helpers from "../../helpers/helpers.js";
  import * as PileUtilities from "../../helpers/pile-utilities.js";
  import { writable } from "svelte/store";
  import LootEntry from "./LootEntry.svelte";

  const { application } = getContext('external');

  export let elementRoot;

  const displayedItemEntries = writable([]);
  const displayedCurrencyEntries = writable([]);

  async function dropData(data) {

    if (!data.type) {
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }

    if (data.type !== "Item") {
      throw Helpers.custom_error("You must drop an item, not " + data.type.toLowerCase() + "!")
    }

    const item = await Item.implementation.fromDropData(data);
    const validItem = await PileUtilities.checkItemType(item, {
      errorText: "ITEM-PILES.Errors.DisallowedItemTrade",
      warningTitle: "ITEM-PILES.Dialogs.TypeWarning.Title",
      warningContent: "ITEM-PILES.Dialogs.TypeWarning.TradeContent"
    });
    if (!validItem) return;

    items.update(value => {
      value.push(validItem);
      return value;
    });

  }

  const itemFilters = PileUtilities.getItemFilters();

  const validItems = game.packs
    .filter(pack => pack.metadata.type === "Item")
    .filter(pack => pack.index.some(item => !PileUtilities.isItemInvalid(item, false, itemFilters)))
    .map(pack => {
      return pack.index
        .filter(item => !PileUtilities.isItemInvalid(item, false, itemFilters))
        .map(item => {
          const name = item.name.toLowerCase();
          const regex = [`[ \\.,:](${name})`, `(${name})[ \\.,:]`]
          if (name.match(/\+\d$/g)) {
            regex.push(`[ \\.,:](\\+${name.slice(-1)} ${name.slice(0, -3)})`)
            regex.push(`(\\+${name.slice(-1)} ${name.slice(0, -3)})[ \\.,:]`)
          }
          item.regex = regex;
          item.uuid = `Compendium.${pack.metadata.id}.${item._id}`
          return item;
        });
    })
    .deepFlatten()
    .sort((a, b) => b.name.length - a.name.length);

  let originalText = `The ground floor of the Daern's instant fortress contains 50,000 cp, 10,000 sp, 10,000 gp, 1,000 pp, 15 assorted gems (100 gp each), and a +2 shield emblazoned with a stylized silver dragon that is the emblem of the Order of the Silver Dragon (see chapter 7). The shield whispers warnings to its bearer, granting a +2 bonus to initiative if the bearer isn't incapacitated.

The upper floor of the tower contains 10 pieces of jewelry (250 gp each) in a red velvet sack, an alchemy jug, a helm of brilliance, a rod of the pact keeper, +1, and an unlocked wooden coffer with four compartments, each one containing a potion of greater healing.`;

  const numberWords = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10
  }

  function processItem(acc, regexMatch) {

    const input = regexMatch.input;

    const preText = input.slice(0, regexMatch.index).split(/[ \n]/g);

    if (preText.slice(-2).includes("the")) return acc;

    let quantity = 1;
    const words = preText.slice(-5).reverse();
    for (const word of words) {
      if (word.endsWith(".") || word.endsWith(",") || word === "a" || word.startsWith("\\n") || word.endsWith("\\n")) break;
      const potentialQuantity = numberWords[word] ?? (!word.startsWith("+") ? Number(word.replace(',', '')) : false);
      if (potentialQuantity) {
        quantity = potentialQuantity;
        break;
      }
    }

    acc.quantity += quantity;
    acc.remove = [regexMatch.index, regexMatch[0].length];

    return acc;
  }

  async function populateLoot() {

    let text = originalText;
    const itemsInText = [];
    for (const item of validItems) {

      const found = item.regex.map(regex => {
        return [...text.toLowerCase().matchAll(new RegExp(regex, "g"))]
      }).find(result => result?.length);

      if (!found) continue;

      const itemToAdd = found.reduce((acc, entry) => processItem(acc, entry), { ...item, quantity: 0 });

      if (!itemToAdd.quantity) continue;

      text = text.slice(0, itemToAdd.remove[0]) + text.slice(itemToAdd.remove[0] + itemToAdd.remove[1]);

      itemsInText.push(itemToAdd);

    }

    const currencyInText = PileUtilities.getCurrencyList()
      .filter(currency => {
        const name = currency.name.toLowerCase;
        const abbreviation = currency.abbreviation.replace("{#}", "").toLowerCase();
        return text.toLowerCase().includes(name)
          || text.toLowerCase().includes(abbreviation);
      }).map(currency => {
        const abbreviation = currency.abbreviation.replace("{#}", "").toLowerCase();
        const regx = new RegExp(`(worth )?([0-9,]*)[ \\.,:]+(${abbreviation})[ \\.,:\n]+(each)?`, 'g');
        return [...text.toLowerCase().matchAll(regx)].reduce((acc, entry) => {
          if (!entry[1] && !entry[4]) {
            acc.quantity += entry[2] ? Number(entry[2].replace(",", "")) : 1;
          }
          return acc;
        }, {
          ...currency,
          quantity: 0
        });
      })
      .filter(currency => currency.quantity)

    let finalText = "Found ";
    if (itemsInText.length) {
      finalText += itemsInText.map(item => `${item.quantity}x ${item.name}`).join(", ")
    }
    if (currencyInText.length) {
      if (itemsInText.length) {
        finalText += " and "
      }
      finalText += currencyInText.map(currency => `${currency.quantity} ${currency.name}`).join(", ");
    }

    let finalItems = [];
    for (const itemData of itemsInText) {
      itemData.id = randomID();
      itemData.item = await fromUuid(itemData.uuid);
      finalItems.push(itemData)
    }
    finalItems.sort((a, b) => b.name > a.name ? -1 : 1);
    displayedItemEntries.set(finalItems);

    displayedCurrencyEntries.set(currencyInText.map(currency => {
      currency.id = randomID();
      return currency;
    }))

  }

  $: {
    $displayedItemEntries = $displayedItemEntries.filter(entry => entry.quantity);
  }

  $: {
    $displayedCurrencyEntries = $displayedCurrencyEntries.filter(entry => entry.quantity);
  }
</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
  <div>
    <div class:item-piles-bottom-divider={$displayedItemEntries.length || $displayedCurrencyEntries.length}>
      <textarea bind:value={originalText} style="height:125px;"></textarea>
      <button type="button" on:click={() => { populateLoot() }}>Evaluate</button>
    </div>
    <div class="item-piles-items-list">
      {#if $displayedItemEntries.length}
        <h3>{localize("ITEM-PILES.Items")}</h3>
        {#each $displayedItemEntries as entry (entry.id)}
          <LootEntry bind:entry={entry}/>
        {/each}
      {/if}
      {#if $displayedItemEntries.length && $displayedCurrencyEntries.length}
        <hr>
      {/if}
      {#if $displayedCurrencyEntries.length}
        <h3>{localize("ITEM-PILES.Currencies")}</h3>
        {#each $displayedCurrencyEntries as entry (entry.id)}
          <LootEntry bind:entry={entry}/>
        {/each}
      {/if}
    </div>
  </div>
</ApplicationShell>
