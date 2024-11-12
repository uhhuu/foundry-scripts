/**
 * see skript on genereeritud chatgpt-ga, võttis paar iteratsiooni, et arendada, aga asja sai.
 * Promptid:
 * 1.   Ok nüüd tee keerulisem skript - 5e reeglite põhjal animated objects loitsu rünnak valitud sihtmärgi (target) vastu, 
 *      arvestades sihtmärgi ac-d, nii, et dialoogis saab kasutaja valida objektide suuruste vahel, objektide arvu 
 *      (maksimaalselt niipalju kui loitsu kirjelduse järgi vastava suurusega objekte saab luua), kas rünnak on tavaline, 
 *      advantage või disadvantage ning tulemuseks peaks olema tabel, iga objekti rünnak valitud sihtmärgi vastu eraldi, 
 *      veeretatud rünnakutäring (attack roll), roheline kui tabab, punane kui ei taba, samal real ka vigastus (damage), 
 *      mis on roheline kui rünnak oli critical success (täringul veeretati 20, boonuseid arvestamata - sel juhul 
 *      arvestades kriitilise tabamuse vigastuse reegleid), arvestades et rünnak läheb igal juhul mööda kui täringul 
 *      veeretati 1 (critical fail), tabeli lõpus kokkuvõte - kui palju rünnakuid tabas, nende hulgas kui palju oli 
 *      kriitilisi tabamusi ja kui palju läks mööda, nende hulgas kriitilisi möödaminemisi (täringul 1)
 * 2.   Täienda skripti nii, et see väljastaks chatti ka sihtmärgi turviseklassi ja elupunktid ning tabamuse all 
 *      ütleks "crit" kui tabamus on crit hit (20) või "perse" kui tabamus on crit fail (1)
 * 3.   Tundub ok, täienda skripti nii, et chati väljundi alguses oleks kirjas, mitu objekti, kui suured, ründavad 
 *      ning mis on nende rünnaku parameetrid (mis täringud, mis boonused on nii rünnakul kui vigastusel), ühtlasi 
 *      muuda objektide arvu valik dropdown menüüks, kus suurim võimalik arv on piiratud vastavalt loitsus määratud
 *      objekti suurusele vastava maksimumiga, aitäh kallis!
 * 4.   kontrolli palun viimases skriptis üle, kas medium suurusega objektide puhul näidatakse õiget objektide arvu 
 *      valikut, mul lubab valida kuni 10 objekti, see ei tundu õige (-> fixis vea, medium objekte sai valida kuni 5)
 * 5.   täienda koodi nii, et kui rünnak on advantage või disadvantagega, siis kuvatakse rünnaku all mõlemad veeretused
 *      sulgudes (praegu on segadusseajav, et kui rünnak on nt disadvantagega, siis mõnikord kuvatakse suurem veeretus, 
 *      mis peaks tabama, aga ikka ei taba ja vastupidi)
 * 6.   lisa väljundi algusse info ka selle kohta, kas rünnakud tehti advantage või disadvantage'ga
 */

(async () => {
    // Kontrolli, kas on valitud sihtmärk
    if (game.user.targets.size === 0) {
      ui.notifications.warn("Palun vali sihtmärk.");
      return;
    }
  
    // Võta esimene sihitud token
    let target = game.user.targets.values().next().value;
    let targetActor = target.actor;
  
    // Saa sihtmärgi AC ja HP
    let targetAC = targetActor.system.attributes.ac.value;
    let targetHP = targetActor.system.attributes.hp.value;
  
    // Objektide suurused ja nende andmed vastavalt loitsule "Animate Objects"
    const objectData = {
      "Tiny": {attackBonus: 8, damageDice: "1d4+4", maxObjects: 10, objectCost: 1},
      "Small": {attackBonus: 6, damageDice: "1d8+2", maxObjects: 10, objectCost: 1},
      "Medium": {attackBonus: 5, damageDice: "2d6+1", maxObjects: 5, objectCost: 2},
      "Large": {attackBonus: 6, damageDice: "2d10+2", maxObjects: 2, objectCost: 4},
      "Huge": {attackBonus: 8, damageDice: "2d12+4", maxObjects: 1, objectCost: 8}
    };
  
    // Funktsioon objektide arvu valiku loomiseks
    function createQuantityOptions(max) {
      let options = '';
      for (let i = 1; i <= max; i++) {
        options += `<option value="${i}">${i}</option>`;
      }
      return options;
    }
  
    // Dialoogivalikud
    let dialogContent = `
    <form>
      <div class="form-group">
        <label>Objekti suurus:</label>
        <select id="size">
          ${Object.keys(objectData).map(size => `<option value="${size}">${size}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Objektide arv:</label>
        <select id="quantity">
          ${createQuantityOptions(objectData["Tiny"].maxObjects)}
        </select>
      </div>
      <div class="form-group">
        <label>Rünnaku tüüp:</label>
        <select id="attackType">
          <option value="normal">Tavaline</option>
          <option value="advantage">Advantage</option>
          <option value="disadvantage">Disadvantage</option>
        </select>
      </div>
    </form>
    `;
  
    let d = new Dialog({
      title: "Animate Objects Rünnak",
      content: dialogContent,
      render: html => {
        // Uuenda objektide arvu valik vastavalt valitud suurusele
        html.find("#size").change(event => {
          let size = event.target.value;
          let maxObjects = objectData[size].maxObjects;
          let quantitySelect = html.find("#quantity");
          quantitySelect.empty();
          quantitySelect.append(createQuantityOptions(maxObjects));
        });
      },
      buttons: {
        ok: {
          label: "Rünnak!",
          callback: async (html) => {
            let size = html.find("#size").val();
            let quantity = parseInt(html.find("#quantity").val());
            let attackType = html.find("#attackType").val();
  
            let data = objectData[size];
  
            let attackBonus = data.attackBonus;
            let damageDice = data.damageDice;
            let objectCost = data.objectCost;
            let totalObjectCost = quantity * objectCost;
  
            if (totalObjectCost > 10) {
              ui.notifications.warn(`Valitud objektide arv ületab maksimaalse lubatud objektide kogumaksumuse (10).`);
              return;
            }
  
            let results = [];
            let hits = 0;
            let critHits = 0;
            let misses = 0;
            let critMisses = 0;
  
            for (let i = 1; i <= quantity; i++) {
              // Veeretage rünnak
              let rollFormula = "1d20";
              if (attackType === "advantage") {
                rollFormula = "2d20kh1";
              } else if (attackType === "disadvantage") {
                rollFormula = "2d20kl1";
              }
              let attackRoll = await new Roll(rollFormula).roll({async: true});
              let dieValues = attackRoll.dice[0].results.map(die => die.result);
              let dieValue = attackRoll.dice[0].total; // Valitud veeretus pärast advantage/disadvantage
  
              let totalAttack = dieValue + attackBonus;
  
              let hit = false;
              let critHit = false;
              let critMiss = false;
              let tabamusText = "";
  
              if (dieValue === 1) {
                critMiss = true;
                misses++;
                critMisses++;
                tabamusText = "perse";
              } else if (dieValue === 20) {
                critHit = true;
                hits++;
                critHits++;
                hit = true;
                tabamusText = "crit";
              } else if (totalAttack >= targetAC) {
                hits++;
                hit = true;
                tabamusText = "Tabab";
              } else {
                misses++;
                tabamusText = "Mööda";
              }
  
              // Arvuta vigastus
              let damageRollFormula = damageDice;
              if (critHit) {
                damageRollFormula += " + " + damageDice;
              }
              let damageRoll = await new Roll(damageRollFormula).roll({async: true});
              let damageTotal = damageRoll.total;
  
              // Lisa tulemus
              results.push({
                dieValues: dieValues,
                dieValue: dieValue,
                attackRoll: attackRoll,
                totalAttack: totalAttack,
                hit: hit,
                critHit: critHit,
                critMiss: critMiss,
                damageRoll: damageRoll,
                damageTotal: damageTotal,
                tabamusText: tabamusText
              });
            }
  
            // Määratle rünnaku tüüp tekstina
            let attackTypeText = "";
            if (attackType === "normal") {
              attackTypeText = "Tavaline rünnak";
            } else if (attackType === "advantage") {
              attackTypeText = "Rünnak advantage'ga";
            } else if (attackType === "disadvantage") {
              attackTypeText = "Rünnak disadvantage'ga";
            }
  
            // Koosta tulemuste tabel
            let resultContent = `
            <p><b>${attackTypeText}</b></p>
            <p><b>Rünnak:</b> ${quantity} x ${size} objekt${quantity > 1 ? 'i' : ''}</p>
            <p><b>Rünnaku boonus:</b> +${attackBonus}</p>
            <p><b>Vigastuse täring:</b> ${damageDice}</p>
            <p><b>Sihtmärk:</b> ${targetActor.name}</p>
            <p><b>Turviseklass (AC):</b> ${targetAC}</p>
            <p><b>Elupunktid (HP):</b> ${targetHP}</p>
            <table border="1" cellspacing="0" cellpadding="4">
              <tr>
                <th>Objekt</th>
                <th>Rünnak</th>
                <th>Tabamus</th>
                <th>Vigastus</th>
              </tr>
            `;
            results.forEach((res, index) => {
              let attackColor = res.hit ? "green" : (res.critMiss ? "red" : "black");
              let damageColor = res.critHit ? "green" : "black";
              let attackRollDisplay = '';
  
              if (attackType === "normal") {
                attackRollDisplay = `${res.dieValue} + ${attackBonus} = ${res.totalAttack}`;
              } else {
                attackRollDisplay = `(${res.dieValues.join(', ')}) + ${attackBonus} = ${res.totalAttack}`;
              }
  
              if (res.critMiss) {
                attackRollDisplay = `<span style="color:red;">${attackRollDisplay}</span>`;
              } else if (res.critHit) {
                attackRollDisplay = `<span style="color:green;">${attackRollDisplay}</span>`;
              }
  
              resultContent += `
              <tr>
                <td>${index + 1}</td>
                <td>${attackRollDisplay}</td>
                <td><span style="color:${attackColor};">${res.tabamusText}</span></td>
                <td><span style="color:${damageColor};">${res.hit ? res.damageTotal : "-"}</span></td>
              </tr>
              `;
            });
            resultContent += `</table>`;
  
            // Lisa kokkuvõte
            resultContent += `
            <p><b>Kokkuvõte:</b></p>
            <p>Tabamusi: ${hits} (sh kriitilisi tabamusi: ${critHits})</p>
            <p>Möödalaskmisi: ${misses} (sh kriitilisi möödalaskmisi: ${critMisses})</p>
            `;
  
            // Saada sõnum chat-i
            ChatMessage.create({content: resultContent});
          }
        },
        cancel: {
          label: "Tühista"
        }
      },
      default: "ok"
    });
    d.render(true);
  })();
  