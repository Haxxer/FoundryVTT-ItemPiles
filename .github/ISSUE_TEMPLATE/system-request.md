---
name: System request
about: Request a new supported system
title: "[SYSTEM] - Write the system's name here"
labels: enhancement
assignees: Haxxer

---

# **[INSERT FOUNDRY PAGE LINK TO SYSTEM HERE]**

### **Actor Class Type**: "[WRITE TYPE HERE]"

*The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.*

D&D5e system example: `character`

### **Item Quantity Attribute**: "[WRITE ATTRIBUTE PATH HERE]"

*The item quantity attribute is the path to the attribute on items that denote how many of that item that exists.*

D&D5e system example: `data.quantity`

### **Item Filters**: "[WRITE ITEM FILTERS HERE]"

*Item filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes.*

D&D5e system example: `spell, feat, class`

### **Item Similarities**: [WRITE ITEM SIMILARITIES HERE]

*Item similarities determines how item piles detect similarities and differences in the system.*

D&D5e system example: `name, type`

### **Currencies**:

*Currencies in item piles are a list of names, attribute paths, and images - the attribute path is relative to the actor.data.*

- **Name**: [WRITE ATTRIBUTE NAME HERE]
    - **Path**: [WRITE ATTRIBUTE PATH HERE]
    - **Image**: [WRITE IMAGE PATH HERE (or blank)]
    
D&D5e system example:

- **Name**: "Platinum Coins",
    - **Path**: "data.currency.pp",
    - **Image**: "icons/commodities/currency/coin-inset-snail-silver.webp"
- **Name**: "Gold Coins",
    - **Path**: "data.currency.gp",
    - **Image**: "icons/commodities/currency/coin-embossed-crown-gold.webp"
- **Name**: "Electrum Coins",
    - **Path**: "data.currency.ep",
    - **Image**: "icons/commodities/currency/coin-inset-copper-axe.webp"
- **Name**: "Silver Coins",
    - **Path**: "data.currency.sp",
    - **Image**: "icons/commodities/currency/coin-engraved-moon-silver.webp"
- **Name**: "Copper Coins",
    - **Path**: "data.currency.cp",
    - **Image**: "icons/commodities/currency/coin-engraved-waves-copper.webp"
