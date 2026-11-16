// Auteur : Nicolas Vannson
// Licence : EUPL-1.2
// Rapport PDF d'un questionnaire MEMAUDATA — nécessite html2pdf.js chargé avant ce script
//
// exporterPDF({
//   questionnaire : "GAI",                      // obligatoire
//   subject       : "Dupont",                   // défaut "SansNom"
//   score         : 12,                         // nombre, ou null/NaN -> "NA"
//   subscores     : { "Anxiete": 7 },           // optionnel, lignes du tableau de scores
//   items         : ["0", "1", "NA", ...],      // obligatoire, réponses brutes
//   itemLabels    : ["Anxiete 1", ...],         // optionnel, défaut "Item 1..N"
//   extra         : { "Heures de port": "..." },// optionnel, tableau supplémentaire
//   perRow        : 5,                          // items par ligne dans le tableau
//   scoreLabel    : "Score total"              // null -> pas de ligne de score total
// })
function exporterPDF({ questionnaire, subject = 'SansNom', score, subscores = {},
  items, itemLabels = null, extra = {}, perRow = 5,
  scoreLabel = 'Score total' }) {
const d = new Date();
const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = d.toLocaleDateString('fr-FR', { dateStyle: 'long' });

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
       .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = v => Number.isFinite(v) ? v : 'NA';
const safeSubject = String(subject).replace(/[\\/:*?"<>|]/g, '_');
// scoreLabel === null : questionnaire sans score total (ex. BAHIA), pas de ligne total
const scoreRows = [...(scoreLabel === null ? [] : [[scoreLabel, score]]), ...Object.entries(subscores)]
.map(([label, v]) => `<tr><td><strong>${esc(label)}</strong></td><td>${fmt(v)}</td></tr>`)
.join('');

const labels = itemLabels || items.map((_, i) => `Item ${i + 1}`);
const step = Math.max(1, perRow);
let itemRows = '';
for (let i = 0; i < items.length; i += step) {
itemRows += '<tr>' + items.slice(i, i + step)
.map((v, j) => `<td><strong>${esc(labels[i + j])}</strong> ${esc(v)}</td>`).join('') + '</tr>';
}

// Tableau supplémentaire (informations complémentaires), masqué s'il est vide
const extraRows = Object.entries(extra)
.map(([label, v]) => `<tr><td><strong>${esc(label)}</strong></td><td>${esc(v)}</td></tr>`)
.join('');
const extraBlock = extraRows ? `<br><table>${extraRows}</table>` : '';

const content = document.createElement('div');
content.lang = 'fr';
content.innerHTML = `
<style>
.memau-report { text-align:center; width:100%; }
.memau-report .header { padding:4% 0; border-bottom:1px solid #2B176C; }
.memau-report .body { padding:5% 0 10%; background:#fff; color:#000; }
.memau-report table { border-collapse:collapse; width:80%; margin:0 auto; }
.memau-report td { border:1px solid #eee; padding:4px 6px; }
.memau-report td strong { display:block; text-align:left; }
</style>
<div class="memau-report">
<div class="header">
<img src="/wp-content/uploads/2025/06/logo-memau-data.svg"
alt="Logo" style="max-width:210px;margin:10px 0 5px;">
<p><i>Contact : hello@memau.eu</i></p>
</div>
<div class="body">
<h1>${esc(questionnaire)}</h1>
<p>Code du Sujet : ${esc(subject)}</p>
<p>Rapport généré le : ${today}</p>
<table>${scoreRows}</table>
<br>
<table>${itemRows}</table>
${extraBlock}
</div>
</div>`;
document.body.appendChild(content);

const cleanup = () => content.remove();

return html2pdf().set({
margin: 10,
filename: `${questionnaire}_${isoDate}_${safeSubject}.pdf`,
image: { type: 'jpeg', quality: 0.98 },
html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowHeight: 1200 },
jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
pagebreak: { avoid: '.body' }
}).from(content).save().then(cleanup, err => { cleanup(); throw err; });
}