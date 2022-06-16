import http from 'http';
import fs from 'fs';

import parseWiki from './parseWiki.js';

const PORT = 4567;


const webPage = fs.readFileSync('./index.html');
let apiUses = parseInt(fs.readFileSync('./apiUses.txt', 'utf-8'), 10);

// Petit serveur HTTP pour répondre à la seule requête de l'API ou envoyer la page web
const server = http.createServer(async (req, res) => {
    if (req.method === 'GET') {
        if (req.url.match(/\/api\/mot\/\w+/)) {
            const mot = req.url.split('/')[3] // On renplace les espaces par un tiret
            res.writeHead(200, { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*" })
            res.end(JSON.stringify(await parseWiki(mot)));
            apiUses++;
        } else {
            res.writeHeader(200, { "Content-Type": "text/html", "Access-Control-Allow-Origin": "*"  });
            res.write(webPage);
            res.end();
        }
    }
});

// Lancement du serveur
server.listen(PORT, () => console.log(`> Serveur lancé sur le port ${PORT}`));


// Petit bout de code pour mettre à jour le nombre de requêtes à l'API
function updateApiUses() {
    fs.writeFileSync('./apiUses.txt', ''+apiUses);
}
setInterval(updateApiUses, 60 * 60 * 1000);
