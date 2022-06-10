import { parse } from 'node-html-parser';
import fetch from 'node-fetch';

const CAT_GRAM = ['étymologie', 'adjectif', 'verbe', 'forme de verbe', 'nom commun', 'forme de nom commun', 'adverbe', 'onomatopée', 'symbole', 'pronom possessif']
const CAT_GRAM_OL = ['adjectif', 'verbe', 'forme de verbe', 'nom commun', 'forme de nom commun', 'adverbe', 'onomatopée', 'symbole', 'pronom possessif']

async function parseWiki(mot) {

    // Récupération du contenu de la page
    const res = await fetch('https://fr.wiktionary.org/wiki/' + mot.replace('%20', '-')); // On renplace les espaces par des tirets
    const body = await res.text();

    // Check que la page existe sinon erreur
    if (res.status != 200) {
        return {
            erreur: 'Problème de récupération du mot.',
            status: res.status
        }
    }

    // Début du parsing
    let response = { mot: decodeURI(mot) }

    let nCatGram;
    let nCatGramOl;
    let langs = [];
    let catGramList = [];
    let catGramOlList = [];

    const root = parse(body);
    const parseOutput = root.querySelector('.mw-parser-output'); // Selection du contenu
    const secTitle = parseOutput.querySelectorAll('h3'); // catégories grammaticales
    const langTitle = root.querySelectorAll('.mw-parser-output > h2 .mw-headline .sectionlangue') // les différentes langues, français + patois
    const ols = root.querySelectorAll('.mw-parser-output > ol');
    const imgs = parseOutput.querySelectorAll('a.image > img');
    const etym = root.querySelectorAll('.mw-parser-output h2 + h3 + dl');

    const toolTips = root.querySelectorAll('sup');
    toolTips.forEach(tt => {
        tt.parentNode.removeChild(tt);
    });

    if (imgs.length > 0) response['imgs'] = [];

    imgs.forEach(img => {
        response['imgs'].push(img.attributes.src.slice(2));
    });

    response['langs'] = langs

    langTitle.forEach(e => {
        langs.push(e.text)
        response[e.text] = {}
    }); // récupération des langues / patois (il y aura toujours Français + ...)

    nCatGram = 0;
    nCatGramOl = 0;
    secTitle.forEach(e => {
        const secTitle = e.querySelector('.mw-headline span').text.replace(/[0-9]/g, '').toLowerCase();
        if (CAT_GRAM.includes(secTitle)) {
            nCatGram++;
            catGramList.push(secTitle);
            if (CAT_GRAM_OL.includes(secTitle)) {
                nCatGramOl++;
                catGramOlList.push(secTitle);
            }
        }
    });

    let tmpList = []
    let langIdx = 0;
    let olIdx = 0;
    catGramList.forEach(cat => {
        if (tmpList.includes(cat)) {
            tmpList = [];
            langIdx++;
        }

        tmpList.push(cat);
        response[langs[langIdx]][cat] = []

        if (CAT_GRAM_OL.includes(cat)) {
            let currOl = ols[olIdx];
            currOl = parse('<div>' + currOl.outerHTML + '</div>'); // Wrapper pour faciliter les selecteurs

            let defs = currOl.querySelectorAll('ol > li');
            let ulExs, resDef;
            defs.forEach(def => {
                resDef = {}

                ulExs = def.querySelector('ul'); // Liste des examples d'utilisation
                def.removeChild(ulExs);

                resDef['def'] = def.text.replace('\n', ' ');

                if (ulExs) {
                    resDef['exs'] = []
                    let exs = ulExs.querySelectorAll('li');
                    exs.forEach(ex => {
                        resDef['exs'].push(ex.text.replace('\n', ' '));
                    });
                }
                
                response[langs[langIdx]][cat].push(resDef);
            });

            olIdx++;
        } else if(CAT_GRAM.includes(cat)) {
            if(cat == 'étymologie') {
                if(etym[langIdx]) {
                    response[langs[langIdx]][cat].push(etym[langIdx].text.replace('\n', ' '));  
                }
            }
        }
    });

    return response;

}

export default parseWiki;

