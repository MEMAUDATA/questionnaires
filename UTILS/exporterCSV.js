// Auteur : Nicolas Vannson
// Licence : EUPL-1.2
// Export CSV d'un questionnaire MEMAUDATA (une ligne par passation)
//
// exporterCSV({
//   questionnaire : "GAI",                      // obligatoire
//   subject       : "Dupont",                   // défaut "SansNom"
//   score         : 12,                         // nombre, ou null/NaN -> "NA"
//   subscores     : { "Anxiete": 7 },           // optionnel, colonnes après Score Total
//   items         : ["0", "1", "NA", ...],      // obligatoire, réponses brutes
//   itemLabels    : ["Anxiete 1", ...],         // optionnel, défaut "Question 1..N"
//   extra         : { "Anx 1": "0", ... }       // optionnel, colonnes en fin de ligne
// })
function exporterCSV({ questionnaire, subject = 'SansNom', score, subscores = {},
  items, itemLabels = null, extra = {} }) {
const d = new Date();
const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const NUM = /^[+-]?\d+(\.\d+)?$/;
const num = v => Number.isFinite(v) ? v : 'NA';
const q = v => {
let s = String(v);
if (!NUM.test(s) && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
return `"${s.replace(/"/g, '""')}"`;
};
const safeSubject = String(subject).replace(/[\\/:*?"<>|]/g, '_');
const labels = itemLabels || items.map((_, i) => `Question ${i + 1}`);
const header = [
'Sujet', 'Date', 'Questionnaire', 'Score Total',
...Object.keys(subscores),
...labels,                 // le ... est indispensable : sans lui, un tableau imbriqué
...Object.keys(extra)
];
const row = [
subject, isoDate, questionnaire, num(score),
...Object.values(subscores).map(num),
...items,
...Object.values(extra)
];

// BOM UTF-8 pour qu'Excel lise correctement les accents
const csv = '﻿' + header.map(q).join(',') + '\n' + row.map(q).join(',') + '\n';

const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
const a = document.createElement('a');
a.href = url;
a.download = `${questionnaire}_${isoDate}_${safeSubject}.csv`;
document.body.appendChild(a);
a.click();
a.remove();
setTimeout(() => URL.revokeObjectURL(url), 1000);
}
