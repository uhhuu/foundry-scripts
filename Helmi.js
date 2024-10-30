/** Script to cast a spell from an item in inventory and reduce item charges accordingly (e.g a homebrew bard's instrument)
 * 
 *  Uses selected token or user main character if no token selected
 * 
 *  Item specs:
 *    - The item has a number of charges (equals to character level)
 *    - The item can be used to cast specific spells (imported from D&D Beyond as item spells, listed under spellbook as "Spell Name (Item Name)")
 *    - To cast a spell, the character must make a (performance) skill check and meet the DC of the specific spell
 *    - The spell can be upcasted to whatever level character has spellslots and item charges for
 *    - Item's charges are reduced by the spell level that was cast
 *    - All charges are refreshed on long rest (not part of this script)
 * 
 * The character may have guidance and advantage on the skill check (help action or some other buff)
 * In case of failure with the skill check, the character might use lucky feat if available 
 *   NB! the problem is that the feat resources may be tracked separately in multiple places in Foundry:
 *      as one of 3 primary resources under actor.system.resources and actor.itemTypes.feat[n] 
 *      this script only uses and updates the latter, ie feat
 * 
 **/

// NB! The script defines the skill check DC-s and such for each spell within the script, since the info is not imported from D&D Beyond

// Call function main
main()

const bOutputChat = true;  // whether to display text to chat (if false, send only to console.log for debugging)
const bUseResources = true; // whether to update resources (item charges, lucky feat) - set to false for easier debugging

// output message to chat log (or console, depending on global variable)
function chatMessage(sContent) {
  if (sContent !== '') {
    if (bOutputChat) {
      // create the message
      let chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker(),
        content: sContent,
      };
      ChatMessage.create(chatData, {});
    }
    else
      console.log("CHATMESSAGE: " + sContent);
  }
}

// spellSpecific - this function is called if spell was successfully cast, to do any spell-specfic customized stuff as needed
async function spellSpecific(oSpell, sSpellChoice, nSpellLvl) {
  switch (sSpellChoice.toLowerCase()) {
    case "aid":
      // in case of aid choose the 3 targets among companions randomly
      const aTargets = ["Jonik", "Pilvi", "Raoul", "Torr"];
      const oRoll = new Roll(`1d${aTargets.length} - 1`).evaluate({ async: false });
      var sVictim = aTargets[oRoll.total];
      let nGainHp = (nSpellLvl - 1) * 5;
      let sResultHtml = aTargets.filter((_, index) => index != oRoll.total).join(", ");
      sResultHtml = `<p><strong>${sResultHtml}</strong> - your Max and Current hp are increased by <strong>${nGainHp}</strong>. Better luck next time, <strong>${sVictim}</strong>!</p>`;
      chatMessage(sResultHtml);
      break;
  }

}

// Define function main
async function main() {

  // define the item and spells first
  const sItemName = "Helmi - Kuldne Harf";
  // array of spells - name - spell name, skillDC - DC for skill check to cast, song: song name (for narrative purposes)
  // optional: overrideLevel - specify different minimum level for spell, overrideScalingMode - specify scaling mode, if the spell allows scaling, but it's not in forge spell data for some reason ("Motivational speech")
  const aSpellList = [
    { name: "Aid", skillDC: 14, song: 'The Beatles "With a little help from my friends"' },
    { name: "Control Weather", skillDC: 16, song: 'Ravel "Bolero"', overrideLevel: 1, overrideScalingMode: "level" },
    { name: "Disguise Self", skillDC: 14, song: 'F. Mercury "The Great Pretender"' },
    { name: "Healing Word", skillDC: 20, song: 'Marvin Gaye "Sexual Healing"' },
    { name: "Locate Object", skillDC: 16, song: 'Jaan Tätte "Silveri laul"' },
    { name: "Motivational Speech", skillDC: 10, song: 'Bob Marley "Get Up, Stand Up"', overrideScalingMode: "level" },
    { name: "Prayer of Healing", skillDC: 18, song: 'R.E.M "Everybody hurts"' },
    { name: "Protection from Evil and Good ", skillDC: 20, song: '"Amazing Grace"' },
    { name: "Seeming", skillDC: 16, song: 'Apelsin "Illusioon"' },
    { name: "Speak with Dead", skillDC: 14, song: 'Cranberries "Zombie"' },
    { name: "Tiny Hut", skillDC: 14, song: 'Lastelaul "Ehitame Maja"' }
  ];
  // which skill to use for skillcheck (as in actor.system.skills)
  const sSkill = "prf"
  const sSkillDescr = "performance"

  // Use selected token or some defaults if nothing is selected.
  const oActor = actor || canvas.tokens.controlled[0] || game.user.character;
  const sActorName = oActor.name;
  if (oActor == null || oActor == undefined) {
    ui.notifications.error(`no character selected, nor user character defined`);
    return;
  }
  console.log(oActor);

  // find the characters level and max spell level
  let nCharLvl = oActor.system.details.level;
  let nMaxSpellLvl = 0;
  for (let i = 1; i <= 9; i++)
    if (oActor.system.spells["spell" + i].max > 0)
      nMaxSpellLvl = i;

  // check if char has access to guidance cantrip
  let bHasGuidanceSpell = false;
  if (oActor.itemTypes.spell.filter(spell => spell.name == "Guidance").length > 0)
    bHasGuidanceSpell = true;
  console.log(`${sActorName}: char level ${nCharLvl}, max spell lvl ${nMaxSpellLvl}, has`, bHasGuidanceSpell ? "" : "no", "guidance spell")

  // find the magic item and it's remaining charges
  let oItem = oActor.items.find(item => item.name == sItemName);
  if (oItem == null || oItem == undefined) {
    ui.notifications.error(`${sActorName} does not have the item ${sItemName}`);
    return;
  }

  let nChargesLeft = oItem.system.uses.value;
  let nChargesMax = oItem.system.uses.max;
  // debug - console.log (oItem);
  //    console.log (`${oItem.name} - has ${oItem.system.uses.value} charges of ${oItem.system.uses.max} remaining`);

  // get the character spells related to the item (to access additional info like spell descr, level etc)
  let aItemSpells = oActor.itemTypes.spell.filter(spell => spell.name.includes("(" + sItemName + ")"))

  // add appropriate spell objects to the aSpellList items defined above
  for (let i = 0; i < aSpellList.length; i++) {
    let aFoundSpells = aItemSpells.filter(spell => spell.name.includes(aSpellList[i].name));
    // if not defined as an item spell or more than 1 instance, throw an error
    if (aFoundSpells == null || aFoundSpells == undefined || aFoundSpells.length == 0) {
      ui.notifications.error(`${aSpellList[i].name} spell not found in item spells`);
      return;
    } else if (aFoundSpells.length > 1) {
      ui.notifications.error(`More than 1 item spell found for spell ${aSpellList[i].name}`);
      return;
    }
    aSpellList[i].spellobject = aFoundSpells[0];

    // NB! if the level requirement is overrided in aSpellList array, change the object accordingly
    if (!(aSpellList[i].overrideLevel == null || aSpellList[i].overrideLevel == undefined))
      aSpellList[i].spellobject.system.level = aSpellList[i].overrideLevel;
    if (!(aSpellList[i].overrideScalingMode == null || aSpellList[i].overrideScalingMode == undefined))
      aSpellList[i].spellobject.system.scaling.mode = aSpellList[i].overrideScalingMode;

    // while we're at it - limit the spell list to spells that can be cast with remaining charges
    if (aSpellList[i].spellobject.system.level > nChargesLeft) {
      aSpellList.splice(i, 1);
      i--; // otherwise we'll skip over next array element in the for cycle
    }
  }

  if (aSpellList.length <= 1) {
    ui.notifications.error(`No spells or not enough resources to cast a spell`);
    return;
  }

  // debug - console.log (aSpellList);

  // create a dialog for selecting spell, level at which to cast and optional bonuses
  const sSpellChoicesHtml = aSpellList.reduce((acc, oSpell) => acc + `<option value="${oSpell.name}">${oSpell.name} (DC:${oSpell.skillDC})</option>`, "");
  const sSpellDropdownHtml = `
      <div class="form-group">
        <label>Spell:</label>
        <div class="form-fields">
          <select name="spellName">${sSpellChoicesHtml}</select>
        </div>
      </div>
      `; // Dropdown to choose the spell
  let sLevelDropdownHtml = `
      <div class="form-group">
        <label>Cast at level:</label>
        <div class="form-fields">
          <select name="spellLvl"></select>
        </div>
      </div>
      `; // Dropdown to choose spell level
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
      `; // Advantage/disadvantage choice
  let sGuidanceCheckboxHtml = `
      <div class="form-group">
        <label>Has guidance?</label>
        <div class="form-fields">
          <input type="checkbox" class="onoffswitch-checkbox" name="guidance" ` + (bHasGuidanceSpell ? ` checked="checked"` : "") + `>
        </div>
      </div>` // Use guidance checkbox

  // use lucky feat by default, if character has it, but add checkbox to opt out
  let sLuckyCheckboxHtml = ""
  let oLucky = oActor.itemTypes.feat.filter(feat => feat.type === "feat" && feat.name.toLowerCase() === "lucky")[0];
  if (!(oLucky === null || oLucky === undefined)) { }
  //      console.log(`Char is Lucky with ${oLucky.system.uses.value} uses remaining`);
  let nLuckyLeft = oLucky.system.uses.value
  if (nLuckyLeft > 0)
    sLuckyCheckboxHtml = `
          <div class="form-group">
          <label>Use lucky (${nLuckyLeft} remaining)?</label>
          <div class="form-fields">
            <input type="checkbox" class="onoffswitch-checkbox" name="uselucky" checked="checked">
          </div>
        </div>` // use lucky feat checkbox

  // use onRender to set event listener to update spell level choices when spell is selected/changed
  function onRender([html]) {
    const oSelectSpell = html.querySelector("select[name=spellName]");
    const oSelectLvl = html.querySelector("select[name=spellLvl]");
    oSelectLvl.innerHTML = selectOptions(oSelectSpell.value);
    oSelectSpell.addEventListener("change", () => {
      oSelectLvl.innerHTML = selectOptions(oSelectSpell.value);
    });
  }

  // selectOptions - populate the spell level dropdown based on chosen spell
  function selectOptions(value) {
    let aOptions = [];
    const oSpell = aSpellList.find(spell => spell.name === value);
    const nMinLvl = oSpell.spellobject.system.level;
    aOptions.push(nMinLvl.toString());

    // if the spell can be upcast, add higher level choices up to charges left or max spellcasting level, whichever is lowest
    if (oSpell.spellobject.system.scaling.mode !== "none")
      for (let j = nMinLvl + 1; j <= Math.min(nMaxSpellLvl, nChargesLeft); j++)
        aOptions.push(j.toString());

    if (aOptions.length == 0) {
      ui.notifications.error(`Unable to determine spell levels for the spell ${value}`);
      return;
    }
    return aOptions.reduce((acc, e) => acc + `<option value="${e}">${e}</option>`, "");
  }

  // display dialog, get some answers
  const dialogResult = await Dialog.prompt({
    title: "Casting a spell with " + sItemName,
    content: `<p>Charges remaining: <strong>${nChargesLeft}</strong></p><form>${sSpellDropdownHtml}${sLevelDropdownHtml}<p><p>Making ${sSkillDescr} skill check:</p>${sGuidanceCheckboxHtml}${sAdvantageChoiceHtml}${sLuckyCheckboxHtml}</form>`,
    callback: ([html]) => new FormDataExtended(html.querySelector("form")).object,
    render: onRender
  })

  // parse dialog results
  let sSpellChoice = (dialogResult.spellName + "");
  let nSpellLvl = parseInt(dialogResult.spellLvl);
  let bGuidanceActive = ((dialogResult.guidance + "").toLowerCase() == "true" ? true : false);
  let bUseLucky = ((dialogResult.uselucky + "").toLowerCase() == "true" ? true : false);
  let nAdvantage = ((dialogResult.advantage + "").toLowerCase() == "normal" ? 0 : (dialogResult.advantage == "advantage" ? 1 : -1));
  let oSpell = aSpellList.find(spell => spell.name == sSpellChoice);
  if (oSpell === null || oSpell === undefined) {
    ui.notifications.error(`Spell object not found for ${sSpellChoice} -- this should not happen, must be a bug!`);
    return;
  }
  let nSkillDC = oSpell.skillDC;

  //    console.log (`Spell choice: ${sSpellChoice}, lvl ${nSpellLvl}, guidance: ${bGuidanceActive}, advantage: ${dialogResult.advantage} ${nAdvantage}, use lucky: ${bUseLucky}`);
  //    console.log(oSpell);

  // reduce number of available charges on item first
  if (bUseResources)
    await oItem.update({ "system.uses.value": nChargesLeft - nSpellLvl })

  // make skill check roll, apply bonuses
  nBonus = oActor.system.skills[sSkill].total;
  let sRoll = ""
  if (nAdvantage === 0)
    sRoll = "1d20";
  else {
    sRoll = "2d20" + (nAdvantage > 0 ? "kh" : "kl");
  }
  sRoll += ` + ${nBonus}` + (bGuidanceActive ? " + 1d4" : "")

  let oRoll = new Roll(sRoll).evaluate({ async: false });
  let nResult = oRoll.total;

  let sSkillCheckHtml = `<p>Attempting to use <strong>${sItemName}</strong> (${nChargesLeft}/${nChargesMax} charges) to cast spell <strong>${sSpellChoice}</strong> at level ${nSpellLvl}.<p>Making a ${sSkillDescr} skill check with a bonus of +${nBonus}` + (nAdvantage === 0 ? "" : " with " + (nAdvantage < 0 ? "dis" : "") + "advantage") + (bGuidanceActive ? " and guidance" : "") + `. Rolling ${sRoll}</p>`;
  chatMessage(sSkillCheckHtml);
  const speaker = ChatMessage.implementation.getSpeaker({ actor: actor });
  if (bOutputChat)
    await oRoll.toMessage({
      rollMode: 'roll',
      speaker
    });
  else
    console.log(oRoll);

  // determine if the roll succeeds or not
  let bSkillSuccess = (nResult >= nSkillDC);
  chatMessage(`<p>With a ${sSkillDescr} roll of ${nResult} against DC${nSkillDC}, the attempt was <strong>` + (bSkillSuccess ? "" : "un") + `successful</strong></p>`);

  if (!bSkillSuccess) {
    // use lucky feat, if so decided
    if (bUseLucky && nLuckyLeft > 0) {
      // reduce lucky remaining uses
      if (bUseResources)
        await oLucky.update({ "system.uses.value": nLuckyLeft - 1 })

      chatMessage(`<p>However, ${sActorName} tries again, using the Lucky feat (${nLuckyLeft - 1} uses remaining after this)</p>`);
      oRoll = new Roll(sRoll).evaluate({ async: false });
      nResult = oRoll.total;
      if (bOutputChat)
        await oRoll.toMessage({
          rollMode: 'roll',
          speaker
        });
      else
        console.log(oRoll);
      bSkillSuccess = (nResult >= nSkillDC);  // the final skill success/failure based on lucky roll
      chatMessage(`<p>With a new roll of ${nResult} against DC${nSkillDC}, the new attempt was ` + (bSkillSuccess ? "a great <strong>success</strong> !" : "unfortunately still <strong>unsuccessful</strong></p>"));
    }
  }

  // if the skillcheck was successful, output spell info
  if (bSkillSuccess) {
    chatMessage(`<p>${sActorName} uses ${sItemName} to cast ${sSpellChoice} at level ${nSpellLvl}. The spell lasts for ${oSpell.spellobject.labels.duration}.</p>`);
    chatMessage(oSpell.spellobject.system.description.value);
  }

  // do any spell-specific stuff, if needed (e.g aid - choose random aTargets, display hp bonus)
  await spellSpecific(oSpell, sSpellChoice, nSpellLvl);

}