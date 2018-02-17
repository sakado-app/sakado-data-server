const util = require('../util');

async function notes(page)
{
    await page.mouse.click(10, 30, {
        delay: 500
    });
    await page.waitFor('#GInterface\\.Instances\\[1\\]_colonne_1');

    let lastNotes = await page.evaluate(() => {
        let notes = document.getElementById('GInterface.Instances[1]_colonne_1').childNodes[1].childNodes[1].childNodes[0].firstChild.childNodes;
        let result = [];

        notes.forEach(n => {
            let [ _, subject, __, note ] = n.firstChild.childNodes;
            let date = n.childNodes[1];

            let dateSplit = date.innerText.substring(3).trim().split('/');
            let current = new Date();

            current.setDate(parseInt(dateSplit[0]));
            current.setMonth(parseInt(dateSplit[1]));
            current.setHours(0);
            current.setMonth(0);
            current.setSeconds(0);
            current.setMilliseconds(0);

            result.push({
                subject: subject.innerText.trim(),
                note: note.innerText.trim().replace(' ', ''),
                time: current.getTime()
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

        return Promise.resolve({
            eleve: parseFloat(result[0].replace(',', '.')),
            classe: parseFloat(result[1].replace(',', '.'))
        });
    });

    return {
        lastNotes,
        moyennes
    };
}

module.exports = notes;
