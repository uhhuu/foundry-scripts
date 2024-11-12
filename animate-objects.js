/**
 * Animate Objects attacks script for Foundry VTT (tested with v10 & v12):
 * works on a single target (double-rightclick)
 * asks for number of objects and object size
 * makes rolls for attacks and damage
 * displays the result in a neat table
 * calculates and displays hits and total damage, based on the AC of selected target
 * 
 * Ideas for future: Pivot from simple animated objects attacks into a full-featured AOMS (Animated Objects Management System)
 *      - tracking of objects throughout their whole short but exciting life:
 *          - creating of any number (within limits set by the spell) of different size objects
 *          - reducing of objects' HP (must be able to target specific objects)
 *          - making saving throws (for selected objects)
 *          - skill checks? (lower prio)
 *          - attacks by a selection of objects (that can be of different sizes)
 *          - tracking objects locations(?)
 **/

// Call function main
main()

// Define function main
async function main() {

    // define the object choices for Animated Object spell
    const nMaxObjects = 10;
    const aAnimatedObjects = [
        { size: "Tiny", hp: 20, ac: 18, str: 4, dex: 18, attackBonus: 8, damageDice: "1d4", damageBonus: 4, countsAs: 1, default: true, defaultCount: 10 },
        { size: "Small", hp: 25, ac: 16, str: 6, dex: 14, attackBonus: 6, damageDice: "1d8", damageBonus: 2, countsAs: 1 },
        { size: "Medium", hp: 40, ac: 13, str: 10, dex: 12, attackBonus: 5, damageDice: "2d6", damageBonus: 1, countsAs: 2 },
        { size: "Large", hp: 50, ac: 10, str: 14, dex: 10, attackBonus: 6, damageDice: "2d10", damageBonus: 2, countsAs: 4 },
        { size: "Huge", hp: 80, ac: 10, str: 18, dex: 6, attackBonus: 8, damageDice: "2d12", damageBonus: 4, countsAs: 8 }
    ];

    // get target data (selected by double right-clicking tokens)
    const aTargets = Array.from(game.user.targets);
    if (aTargets.length == 0) {
        ui.notifications.error("No target selected!");
        return;
    }
    if (aTargets.length > 1) {
        ui.notifications.error("Multiple targets selected, this macro works only on single target!");
        return;
    }

    const oTarget = aTargets[0].actor;
    const sTargetName = oTarget.name;
    let nTargetAC = oTarget.system.attributes.ac.value;
    let nTargetHP = oTarget.system.attributes.hp.value;
    let nTargetMaxHP = oTarget.system.attributes.hp.max;

    console.log(oTarget);
    console.log(`${sTargetName} HP: ${nTargetHP} / ${nTargetMaxHP}   AC:${nTargetAC}`);

    // create dialog for object selection (object size, count, advantage?)
    const sSizeChoicesHtml = aAnimatedObjects.reduce((acc, oObject) => acc + `
        <option value="${oObject.size}"${(oObject.default ? " selected" : "")}>
            ${oObject.size} (HP${oObject.hp} AC${oObject.ac} Atk:1d20+${oObject.attackBonus} Dmg:${oObject.damageDice}${(oObject.damageBonus > 0 ? "+" : "")}${oObject.damageBonus})
        </option>
        `, "");
    
    // Dropdown to choose objects' size
    const sSizeDropdownHtml = `
      <div class="form-group">
        <label>Size of objects:</label>
        <div class="form-fields">
          <select name="objectSize">${sSizeChoicesHtml}</select>
        </div>
      </div>
      `; 

    // Dropdown to choose number of objects - will be populated by a later function, that runs when size of objects is selected
    let sCountDropdownHtml = `
      <div class="form-group">
        <label>Number of objects:</label>
        <div class="form-fields">
          <select name="objectCount"></select>
        </div>
      </div>
      `; 

    // Advantage/disadvantage choice
    let sAdvantageChoiceHtml = `
      <div class="form-group">
        <label>(Dis-)advantage?</label>
        <div class="form-fields">
          <select name="advantage">
            <option value="normal">Normal</option>
            <option value="advantage">Advantage</option>
            <option value="disadvantage">Disadvantage</option>
          </select>
        </div>
      </div>
      `; 

    // use onRender to 1) populate initial dropdown for object count and 2) set event listener to update number of objects choices when objects' size changes
    function onRender([html]) {
        const objectSize = html.querySelector("select[name=objectSize]");
        const objectCount = html.querySelector("select[name=objectCount]");
        objectCount.innerHTML = selectOptions(objectSize.value);
        objectSize.addEventListener("change", () => {
            objectCount.innerHTML = selectOptions(objectSize.value);
        });
    }

    // selectOptions - populate the object count dropdown based on chosen object size
    function selectOptions(value) {
        let sOptions = "";
        const oObject = aAnimatedObjects.find(object => object.size === value);
        const nMaxForSize = Math.floor(nMaxObjects / oObject.countsAs);

        for (i = 1; i <= nMaxForSize; i++)
            sOptions += `<option value=${i}${(i === nMaxForSize ? " selected" : "")}>${i}</option>`; // default to max number of objects
        return sOptions;
    }

    // display dialog, have some important life choices made
    let oDialogResult = await Dialog.prompt({
        title: "Making Animated Objects spell attacks",
        content: `<p><strong>Attacking ${sTargetName} (AC ${nTargetAC} HP ${nTargetHP}/${nTargetMaxHP})</strong></p><form>${sSizeDropdownHtml}${sCountDropdownHtml}${sAdvantageChoiceHtml}</form>`,
        callback: ([html]) => new FormDataExtended(html.querySelector("form")).object,
        render: onRender
    })

    // parse dialog results
    let oObject = aAnimatedObjects.find(object => object.size === oDialogResult.objectSize);
    let nObjectCount = parseInt(oDialogResult.objectCount);
    let nAdvantage = ((oDialogResult.advantage + "").toLowerCase() == "normal" ? 0 : (oDialogResult.advantage == "advantage" ? 1 : -1));    // codify advantage: -1 disadvantage, 0 - normal, 1 - advantage
    console.log(oObject);
    console.log(`Object size: ${oObject.size} Count: ${nObjectCount}  Advantage: ${nAdvantage}`);

    // start creating output for chat message - general info about the attacking objects and table header
    sOutputHtml = `
        <p><strong>Animated Objects Attack!</strong></p>
        <p>Making <strong>${nObjectCount} ${oObject.size}</strong> object attacks${(nAdvantage === 0 ? "" : " <strong>with " + (nAdvantage < 0 ? "dis" : "") + "advantage</strong>")}
        against ${sTargetName} (AC${nTargetAC}). Object Attack:1d20+${oObject.attackBonus} Damage:${oObject.damageDice}${(oObject.damageBonus > 0 ? "+" : "")}${oObject.damageBonus}</p>
        <table>
            <thead>    
                <tr>
                    <th>Object</th>
                    <th>Atk</th>
                    <th>Dmg</th>
                </tr>
            </thead>
            <tbody>
        `;

    // set the attack dice based on advantage/disadvantage
    let sAtkRoll = "1d20";
    if (nAdvantage !== 0)
        sAtkRoll = "2d20" + (nAdvantage > 0 ? "kh" : "kl");

    // initialize totals
    let nDamageSum = 0;
    let nHitCount = 0;
    let nCritCount = 0;

    // make required number of attack and damage rolls, add to the output message (table)
    for (let i = 1; i <= nObjectCount; i++) {

        // make only d20 roll for attack, add bonus separately - easier to check for a crit later
        let oAtkRoll = new Roll(sAtkRoll).evaluate({ async: false });
        let nAtkTotal = oAtkRoll.total + oObject.attackBonus;

        // text colors - attack is green in case of hit, red in case of miss; dmg is green in case of crit hit, black in case of normal hit/miss, red in case of crit miss
        let sAtkColor = "black";
        let sDmgColor = "black";

        // roll damage dice, add bonus separately, easier to double for crit
        let oDmgRoll = new Roll(oObject.damageDice).evaluate({ async: false });
        let nDmgTotal = oDmgRoll.total + oObject.damageBonus;

        // check for attack crit separately - double the rolled damage in this case
        if (oAtkRoll.total === 20) {
            nDmgTotal += oDmgRoll.total; // add the dice to damage value again
            nCritCount++;
            sDmgColor = "green";        // color the damage green in case of a crit hit
        }

        // check for crit fail - no need to check ac in such case
        if (oAtkRoll.total === 1) {
            sAtkColor = "red";
            sDmgColor = "red";
        } else if (nAtkTotal >= nTargetAC || oAtkRoll.total === 20) {
            // the attack hits, set colors, increase total damage
            sAtkColor = "green";
            nHitCount++;
            nDamageSum += nDmgTotal
        } else
            sAtkColor = "red";

        sOutputHtml += `
            <tr>
                <td>${i}</td>
                <td style="color: ${sAtkColor};">${nAtkTotal}</td>
                <td style="color: ${sDmgColor};">${nDmgTotal}</td>
            </tr>
        `;
    }

    // finalize the table by adding totals as table footer
    sOutputHtml += `
            </tbody>
            <tfoot>
                <tr>
                    <td><strong>Total:</strong></td>
                    <td><strong>${nHitCount} hits, ${nCritCount} crits</strong></td>
                    <td><strong>${nDamageSum} damage</strong></td>
                </strong></tr>
            </tfoot>
        </table>
        `;

    // output the results to console log and as chat message
    console.log(sOutputHtml);

    let chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker(),
        content: sOutputHtml
    };

    await ChatMessage.create(chatData, {});
}
