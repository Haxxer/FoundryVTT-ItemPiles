<script>

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { get } from "svelte/store";
  import { canItemStack } from "../../helpers/utilities.js";

  export let entry;

  const canPreview = entry.type !== "attribute";
  const canStack = entry.type === "attribute" || canItemStack(entry);

  function previewItem() {
    if (!canPreview) return;
    return entry.item.sheet.render(true);
  }

</script>

<div class="item-piles-flexrow item-piles-item-row item-piles-even-color">

  <div class="item-piles-img-container">
    <img class="item-piles-img" src="{entry.img}"/>
  </div>

  <div class="item-piles-name">
    <div class="item-piles-name-container">
      <p class:item-piles-clickable-link={canPreview} on:click={previewItem}>{entry.name}</p>
    </div>
  </div>

  {#if canStack}
    <div class="item-piles-quantity-input-container">
      <input class="item-piles-quantity" type="number" min="0" value={entry.quantity}
             on:change={(evt) => { entry.quantity = Number(evt.target.value)}}/>
    </div>
  {/if}

  <button type="button" class="item-piles-small-button" style="color: #d31e1e;"
          on:click={() => { entry.quantity = 0; }}><i class="fas fa-trash-can"></i>
  </button>

</div>
