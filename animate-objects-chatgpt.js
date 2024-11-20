/**
 * Foundry VTT, D&D 5e, animated objects rünnaku loits
 * 
 * See skript on genereeritud openAI chatGPT-ga (o1-preview, 13.11.2024), võttis paar iteratsiooni, et arendada, aga asja sai.
 * 
 * Promptid (eelnevalt oli määratletud Foundry VTT kontekst ning chatgpt tegi lihtsa skripti valitud sihtmärgi AC ja HP kuvamiseks):
 * 
 * 1.   Ok nüüd tee keerulisem skript - 5e reeglite põhjal animated objects loitsu rünnak valitud sihtmärgi (target) vastu, 
 *      arvestades sihtmärgi ac-d, nii, et dialoogis saab kasutaja valida objektide suuruste vahel, objektide arvu 
 *      (maksimaalselt niipalju kui loitsu kirjelduse järgi vastava suurusega objekte saab luua), kas rünnak on tavaline, 
 *      advantage või disadvantage ning tulemuseks peaks olema tabel, iga objekti rünnak valitud sihtmärgi vastu eraldi, 
 *      veeretatud rünnakutäring (attack roll), roheline kui tabab, punane kui ei taba, samal real ka vigastus (damage), 
 *      mis on roheline kui rünnak oli critical success (täringul veeretati 20, boonuseid arvestamata - sel juhul 
 *      arvestades kriitilise tabamuse vigastuse reegleid), arvestades et rünnak läheb igal juhul mööda kui täringul 
 *      veeretati 1 (critical fail), tabeli lõpus kokkuvõte - kui palju rünnakuid tabas, nende hulgas kui palju oli 
 *      kriitilisi tabamusi ja kui palju läks mööda, nende hulgas kriitilisi möödaminemisi (täringul 1)
 * 
 * 2.   Täienda skripti nii, et see väljastaks chatti ka sihtmärgi turviseklassi ja elupunktid ning tabamuse all 
 *      ütleks "crit" kui tabamus on crit hit (20) või "perse" kui tabamus on crit fail (1)
 * 
 * 3.   Tundub ok, täienda skripti nii, et chati väljundi alguses oleks kirjas, mitu objekti, kui suured, ründavad 
 *      ning mis on nende rünnaku parameetrid (mis täringud, mis boonused on nii rünnakul kui vigastusel), ühtlasi 
 *      muuda objektide arvu valik dropdown menüüks, kus suurim võimalik arv on piiratud vastavalt loitsus määratud
 *      objekti suurusele vastava maksimumiga, aitäh kallis!
 * 
 * 4.   kontrolli palun viimases skriptis üle, kas medium suurusega objektide puhul näidatakse õiget objektide arvu 
 *      valikut, mul lubab valida kuni 10 objekti, see ei tundu õige (-> fixis vea, medium objekte sai valida kuni 5)
 * 
 * 5.   täienda koodi nii, et kui rünnak on advantage või disadvantagega, siis kuvatakse rünnaku all mõlemad veeretused
 *      sulgudes (praegu on segadusseajav, et kui rünnak on nt disadvantagega, siis mõnikord kuvatakse suurem veeretus, 
 *      mis peaks tabama, aga ikka ei taba ja vastupidi)
 * 
 * 6.   lisa väljundi algusse info ka selle kohta, kas rünnakud tehti advantage või disadvantage'ga
 * 
 * 7.   palun kontrolli kriitilise tabamuse puhul vigastus üle - siis peaks ainult täringute vigastus minema topelt, 
 *      aga mulle tundub, et su koodis läheb topelt ka boonus (mis ei peaks topelt minema), ühtlasi palun pane 
 *      väljundisse kirja, millest täpselt vigastus koosneb, täringuveeretus(ed) + boonus
 * 
 * 8.   muuda seda nii, et crit tabamuse puhul näidatakse vigastuste tulemustes mõlemat täringu veeretust 
 *      (näiteks 2+3+ boonus)
 * 
 * 9.   Palun lisa tulemuste kokkuvõttesse ka, kui palju oli kõikide vigastuste summa
 * 
 * 10.  Täienda skripti nii, et dialoogis saaks valida, kas tegemist on rünnaku või saving throw'ga,
 *      rünnaku puhul oleks nii nagu praegu, aga saving throw puhul saaks saaks lisaks valida,
 *      millise atribuudi saving throw'ga on tegemist (saving throw võib ka olla advantage/disadvantage, nagu rünnak)
 *      ning väljundiks oleks tabeli kujul iga objekti saving throw, objekti suurusele vastavalt,
 *      nagu loitsu kirjelduses määratud. Skript peaks väljastama ka info selle kohta sarnaselt rünnakuga,
 *      et mis atribuudi saving throw tehakse, mis on selle boonus ja tabelis näitama advantage-disadvantage korral
 *      mõlemad veeretused, sarnaselt rünnakuga 
 * 
 * 11.  Muuda skripti nii, et sundviske korral ei eeldata DC teadmist, st tehakse ainult sundvisked ning
 *      väljastatakse nende tulemused, ilma mingi DC-ga võrdlemata, kuna see ei pruugi olla mängijale teada.
 *      Lisaks kontrolli palun üle atribuutide boonused vastavalt loitsus kirjeldatule, mulle tundub,
 *      et -5 pole näiteks õige, aga vaata ka teised üle. 
 * 
 * 12.  Kui dialoogis valida sundvise, siis tuleb dialoogi atribuudi valik juurde, 
 *      aga dialoog jääb samasuureks kui oli enne, mis tähendab, et all olevad dialoogi nupud 
 *      ei mahu enam dialoogi ära (tekib kerimisriba). 
 *      Muuda koodi palun nii, et dialoog oleks algusest peale nii suur,
 *      et ka sundviskega seonduv lisavalik mahuks dialoogi ära koos muude valikute ja nuppudega
 * 
 * NB! Pärast järgmist muudatust muutus kogu skript ilmselt liiga pikaks, et chatGPT ei väljastanud 
 *  seda enam terves tükis, vaid pakkus mitmeks osaks jagamist. 
 *  Kuigi see põhimõtteliselt toimis, muutis chatGPT selle käigus koodi funktsionaalsust omajagu 
 *  (näiteks jättis välja rünnaku korral osa infost, mida enne väljastas), 
 *  ei viitsinud ma selle korda saamisega enam jätkata
 * 
 * 13 (mis jäi teostamata).  Muuda skripti nii, et kohe alguses ei kontrollita, kas sihtmärk on valitud, 
 *      seda kontrollitakse vaid juhul kui dialoogis valitakse rünnak 
 *      (sundviske korral ei pea olema mingit sihtmärki)
 * 
 * Proovisin ilma tükeldamata ka mingit lihtsamat muudatust 
 *    (et dialoogis oleks alati vaikimisi valitud suurim võimalik arv objekte)
 *    ka siis läks asi lappama - oluline osa koodist, tulemuste väljastamine, kadus lihtsalt ära
 *    küll aga toimis viimase puhul konkreetse muudatuse koha küsimine, siis väljastas chatGPT 
 *    createQuantityOptions funktsioonis vajaliku muudatuse
 *
 **/

(async () => {
  // Kontrolli, kas on valitud sihtmärk
  if (game.user.targets.size === 0) {
    ui.notifications.warn("Palun vali sihtmärk.");
    return;
  }

  // Võta esimene sihitud token
  let target = game.user.targets.values().next().value;
  let targetActor = target.actor;

  // Objektide suurused ja nende andmed vastavalt loitsule "Animate Objects"
  const objectData = {
    "Tiny": {
      attackBonus: 8,
      damageDice: "1d4+4",
      saveModifiers: {
        "STR": -3,
        "DEX": 4,
        "CON": 0,
        "INT": -4,
        "WIS": -4,
        "CHA": -5
      },
      maxObjects: 10,
      objectCost: 1
    },
    "Small": {
      attackBonus: 6,
      damageDice: "1d8+2",
      saveModifiers: {
        "STR": -2,
        "DEX": 2,
        "CON": 0,
        "INT": -4,
        "WIS": -4,
        "CHA": -5
      },
      maxObjects: 10,
      objectCost: 1
    },
    "Medium": {
      attackBonus: 5,
      damageDice: "2d6+1",
      saveModifiers: {
        "STR": 0,
        "DEX": 1,
        "CON": 0,
        "INT": -4,
        "WIS": -4,
        "CHA": -5
      },
      maxObjects: 5,
      objectCost: 2
    },
    "Large": {
      attackBonus: 6,
      damageDice: "2d10+2",
      saveModifiers: {
        "STR": 2,
        "DEX": 0,
        "CON": 0,
        "INT": -4,
        "WIS": -4,
        "CHA": -5
      },
      maxObjects: 2,
      objectCost: 4
    },
    "Huge": {
      attackBonus: 8,
      damageDice: "2d12+4",
      saveModifiers: {
        "STR": 4,
        "DEX": -2,
        "CON": 0,
        "INT": -4,
        "WIS": -4,
        "CHA": -5
      },
      maxObjects: 1,
      objectCost: 8
    }
  };

  // Atribuudid sundvisete jaoks
  const savingThrows = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

  // Funktsioon objektide arvu valiku loomiseks
  function createQuantityOptions(max) {
    let options = '';
    for (let i = 1; i <= max; i++) {
      options += `<option value="${i}" ${i === max ? "selected" : ""}>${i}</option>`;
    }
    return options;
  }

  // Dialoogivalikud
  let dialogContent = `
  <form>
    <div class="form-group">
      <label>Toiming:</label>
      <select id="actionType">
        <option value="attack">Rünnak</option>
        <option value="save">Sundvise</option>
      </select>
    </div>
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
    <div class="form-group" id="attackTypeGroup">
      <label>Rünnaku tüüp:</label>
      <select id="attackType">
        <option value="normal">Tavaline</option>
        <option value="advantage">Advantage</option>
        <option value="disadvantage">Disadvantage</option>
      </select>
    </div>
    <div class="form-group" id="saveTypeGroup" style="display:none;">
      <label>Sundviske atribuudi tüüp:</label>
      <select id="saveAttribute">
        ${savingThrows.map(attr => `<option value="${attr}">${attr}</option>`).join('')}
      </select>
    </div>
    <div class="form-group" id="saveAdvantageGroup" style="display:none;">
      <label>Sundviske tüüp:</label>
      <select id="saveType">
        <option value="normal">Tavaline</option>
        <option value="advantage">Advantage</option>
        <option value="disadvantage">Disadvantage</option>
      </select>
    </div>
  </form>
  `;

  let d; // Määrame dialoogi muutujana välises ulatuses

  d = new Dialog({
    title: "Animate Objects Toiming",
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

      // Näita või peida välju vastavalt valitud toimingule
      html.find("#actionType").change(event => {
        let actionType = event.target.value;
        if (actionType === "attack") {
          html.find("#attackTypeGroup").show();
          html.find("#saveTypeGroup").hide();
          html.find("#saveAdvantageGroup").hide();
        } else {
          html.find("#attackTypeGroup").hide();
          html.find("#saveTypeGroup").show();
          html.find("#saveAdvantageGroup").show();
        }

        // Kohanda dialoogi suurust
        setTimeout(() => {
          d.setPosition({height: "auto"});
        }, 10);
      });
    },
    buttons: {
      ok: {
        label: "Soorita!",
        callback: async (html) => {
          let actionType = html.find("#actionType").val();
          let size = html.find("#size").val();
          let quantity = parseInt(html.find("#quantity").val());
          let data = objectData[size];
          let objectCost = data.objectCost;
          let totalObjectCost = quantity * objectCost;

          if (totalObjectCost > 10) {
            ui.notifications.warn(`Valitud objektide arv ületab maksimaalse lubatud objektide kogumaksumuse (10).`);
            return;
          }

          if (actionType === "attack") {
            // Rünnaku loogika
            let attackType = html.find("#attackType").val();
            let attackBonus = data.attackBonus;
            let damageDice = data.damageDice;

            let results = [];
            let hits = 0;
            let critHits = 0;
            let misses = 0;
            let critMisses = 0;
            let totalDamage = 0;

            // Parsime damageDice
            let { numDice, diceSides, bonus } = parseDamageDice(damageDice);

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
              let dieValue = attackRoll.total; // Valitud veeretus pärast advantage/disadvantage

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
              } else if (totalAttack >= targetActor.system.attributes.ac.value) {
                hits++;
                hit = true;
                tabamusText = "Tabab";
              } else {
                misses++;
                tabamusText = "Mööda";
              }

              // Arvuta vigastus
              let totalNumDice = numDice;
              if (critHit) {
                totalNumDice *= 2; // Topeldame ainult täringute arvu
              }
              let damageRollFormula = `${totalNumDice}d${diceSides}`;
              let damageRoll = await new Roll(damageRollFormula).roll({async: true});
              let damageTotal = damageRoll.total + bonus;

              // Lisame koguvigastusele
              if (hit) {
                totalDamage += damageTotal;
              }

              // Koosta vigastuse üksikasjad
              let damageDieValues = damageRoll.dice[0].results.map(die => die.result);
              let damageDieString = damageDieValues.join(' + ');
              let damageBreakdown = `${damageDieString} + ${bonus} = ${damageTotal}`;

              // Lisa tulemus
              results.push({
                dieValues: dieValues,
                dieValue: dieValue,
                totalAttack: totalAttack,
                hit: hit,
                critHit: critHit,
                critMiss: critMiss,
                damageTotal: damageTotal,
                tabamusText: tabamusText,
                damageBreakdown: damageBreakdown
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
            <p><b>Turviseklass (AC):</b> ${targetActor.system.attributes.ac.value}</p>
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
                <td><span style="color:${damageColor};">${res.hit ? res.damageBreakdown : "-"}</span></td>
              </tr>
              `;
            });
            resultContent += `</table>`;

            // Lisa kokkuvõte
            resultContent += `
            <p><b>Kokkuvõte:</b></p>
            <p>Tabamusi: ${hits} (sh kriitilisi tabamusi: ${critHits})</p>
            <p>Möödalaskmisi: ${misses} (sh kriitilisi möödalaskmisi: ${critMisses})</p>
            <p><b>Kõikide vigastuste summa:</b> ${totalDamage}</p>
            `;

            // Saada sõnum chat-i
            ChatMessage.create({content: resultContent});
          } else {
            // Sundviske loogika
            let saveAttribute = html.find("#saveAttribute").val();
            let saveType = html.find("#saveType").val();
            let saveModifier = data.saveModifiers[saveAttribute];

            let results = [];

            for (let i = 1; i <= quantity; i++) {
              // Veeretage sundvise
              let rollFormula = "1d20";
              if (saveType === "advantage") {
                rollFormula = "2d20kh1";
              } else if (saveType === "disadvantage") {
                rollFormula = "2d20kl1";
              }
              let saveRoll = await new Roll(rollFormula).roll({async: true});
              let dieValues = saveRoll.dice[0].results.map(die => die.result);
              let dieValue = saveRoll.total; // Valitud veeretus pärast advantage/disadvantage

              let totalSave = dieValue + saveModifier;

              // Lisa tulemus
              results.push({
                dieValues: dieValues,
                dieValue: dieValue,
                totalSave: totalSave
              });
            }

            // Määratle sundviske tüüp tekstina
            let saveTypeText = "";
            if (saveType === "normal") {
              saveTypeText = "Tavaline sundvise";
            } else if (saveType === "advantage") {
              saveTypeText = "Sundvise advantage'ga";
            } else if (saveType === "disadvantage") {
              saveTypeText = "Sundvise disadvantage'ga";
            }

            // Koosta tulemuste tabel
            let resultContent = `
            <p><b>${saveTypeText}</b></p>
            <p><b>Sundvise:</b> ${quantity} x ${size} objekt${quantity > 1 ? 'i' : ''}</p>
            <p><b>Sundviske atribuut:</b> ${saveAttribute}</p>
            <p><b>Sundviske boonus:</b> ${saveModifier >= 0 ? '+' : ''}${saveModifier}</p>
            <table border="1" cellspacing="0" cellpadding="4">
              <tr>
                <th>Objekt</th>
                <th>Sundvise veeretus</th>
              </tr>
            `;
            results.forEach((res, index) => {
              let saveRollDisplay = '';

              if (saveType === "normal") {
                saveRollDisplay = `${res.dieValue} + ${saveModifier} = ${res.totalSave}`;
              } else {
                saveRollDisplay = `(${res.dieValues.join(', ')}) + ${saveModifier} = ${res.totalSave}`;
              }

              resultContent += `
              <tr>
                <td>${index + 1}</td>
                <td>${saveRollDisplay}</td>
              </tr>
              `;
            });
            resultContent += `</table>`;

            // Saada sõnum chat-i
            ChatMessage.create({content: resultContent});
          }
        }
      },
      cancel: {
        label: "Tühista"
      }
    },
    default: "ok"
  });
  d.render(true);

  // Funktsioon damageDice parsimiseks
  function parseDamageDice(damageDice) {
    let regex = /(\d+)d(\d+)(\+(\d+))?/;
    let match = damageDice.match(regex);
    if (!match) {
      throw new Error("Vigane vigastuse täringu formaat");
    }
    let numDice = parseInt(match[1]);
    let diceSides = parseInt(match[2]);
    let bonus = match[4] ? parseInt(match[4]) : 0;
    return { numDice, diceSides, bonus };
  }
})();

