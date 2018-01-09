const util = require('../util');

async function notes({ page })
{
    await page.mouse.click(10, 30, {
        delay: 500
    });
    await page.waitFor('#GInterface\\.Instances\\[1\\]_colonne_1');

    let lastNotes = await page.evaluate(() => {
        let notes = document.getElementById('GInterface.Instances[1]_colonne_1').childNodes[1].childNodes[1].childNodes;
        let result = [];

        notes.forEach(n => {
            let [ _, subject, __, note ] = n.firstChild.firstChild.firstChild.childNodes;
            let date = n.firstChild.firstChild.childNodes[1];

            result.push({
                subject: subject.innerText.trim(),
                note: note.innerText.trim().replace(' ', ''),
                date: date.innerText.substring(3).trim()
            });
        });

        return Promise.resolve(result);
    });

    await util.goTo(page, 'Détail des notes');
    await util.waitForLoading(page);
    await page.waitFor('#GInterface\\.Instances\\[1\\]\\.Instances\\[1\\]_piedDeListe');

    let moyennes = await page.evaluate(() => {
        let moyennes = document.getElementById('GInterface.Instances[1].Instances[1]_piedDeListe').innerText.split('\n');
        let result = [];

        for (let i = 0; i < 2; i++) {
            let m = moyennes[i];
            result.push(m.substring(m.indexOf(':') + 2, m.length).trim());
        }

        return Promise.resolve(result);
    });

    return {
        lastNotes,
        moyennes
    };
}

module.exports = notes;