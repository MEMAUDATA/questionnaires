// Auteur : Nicolas Vannson
// Licence : EUPL-1.2
// Helpers communs à la famille SSQ (sliders 0-10 + case « non applicable »).
// Partagés par SSQ5, SSQ12, 15iSSQ, Kid-SSQ, SSQ49 et SHQ.


function ssqValeurs(sliderIds, naIds) {
  return sliderIds.map((id, i) => {
    const na = document.getElementById(naIds[i]);
    const s = document.getElementById(id);
    return (!s || (na && na.checked)) ? 'NA' : s.value;
  });
}


function ssqMoyenne(valeurs) {
  const nums = valeurs.filter(v => v !== 'NA').map(v => parseFloat(v));
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((s, v) => s + v, 0) / nums.length) * 100) / 100;
}

// Moyenne d'un sous-ensemble d'items, désignés par leur numéro (1-based)
function ssqMoyenneItems(valeurs, numeros) {
  return ssqMoyenne(numeros.map(n => valeurs[n - 1]));
}

// Moyenne de plusieurs sous-scores déjà calculés ; null si l'un d'eux est null
function ssqMoyenneSousScores(scores) {
  if (scores.some(s => s === null)) return null;
  return Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100;
}

// Formatage pour l'affichage : « NA » plutôt que « NaN » ou « null »
function ssqFmt(v) {
  return Number.isFinite(v) ? v.toFixed(2) : 'NA';
}
