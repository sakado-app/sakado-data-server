const util = require('../util');

async function notes({ page })
{
    await page.mouse.click(10, 75);
    await util.waitForLoading(page);

    let lastNotes = await page.evaluate(() => {
        let notes = document.getElementById('id_98_suffContent').childNodes;
        let result = [];

        notes.forEach(n => {
            let [ subject, note, date ] = n.innerText.split('\n');
            result.push({
                subject: subject.trim(),
                note: note.replace(' ', ''),
                date: date.substring(3)
            });
        });

        return Promise.resolve(notes);
    });

    await util.goTo(page, 'Détail des notes');
    await util.waitForLoading(page);

    let moyennes = await page.evaluate(() => {
        let moyennes = document.getElementById('GInterface.Instances[1].Instances[1]_piedDeListe').innerText.split('\n');
        let result = [];

        moyennes.forEach(m => result.push(m.substring(m.indexOf(':') + 2, m.length).trim()));
    });

    return {
        lastNotes,
        moyennes
    };
}

module.exports = notes;