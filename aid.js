// uses several examples - Warpugss, NeoShain etc

const targets = ["Jonik", "Pilvi", "Raoul", "Torr"];
const roll = await new Roll(`1d${targets.length} - 1`).roll();
var resulttext = ""
var victim = targets[roll.total];
for (var i = 0; i < targets.length; i++)
{
  if (i != roll.total)
  {
    if (resulttext != "")
      resulttext = resulttext + ", "
    resulttext = resulttext + targets[i];
  }
}

new Dialog({
  title: "Casting Aid",
  content: `
    <form>
        <div class="form-group">
          <label>Spell level:</label>
        <input type='number' name='spellLevel'/>
        </div>
    </form>`,
  buttons:{
    yes: {
      icon: "<i class='fas fa-check'></i>",
      label: `Cast`
    }
  },
  default:'yes',
  close: ([html]) => {
    const {spellLevel} = new FormDataExtended(html.querySelector("form")).object;
    let hpGain = (spellLevel - 1) * 5;
    let aliasTxt = "Raoul Roquefort Rioja";      

    if (hpGain > 0) {
      resulttext = "<h3>Raoul loitsib Aid'i " + spellLevel + ". tasemel</h3><p> <strong>" + resulttext + "</strong> - teie max ja current hp'd suureneved <strong>" + hpGain + "</strong> võrra! "
      if (victim == "Raoul") {
        resulttext = resulttext + "(kui ebakarakteristlikult üllas ja altruistlik <strong>Raoul'ist</strong> ennast mitte aidata!)";
      } else {
        resulttext = resulttext + "(sorry <strong>" + victim +"</strong>, ehk veab järgmine kord paremini).";
      }

      let chatData = {
          speaker: {alias: aliasTxt}, 
          content: resulttext
        };
      ChatMessage.create(chatData, {});
    }
  }

}).render(true);