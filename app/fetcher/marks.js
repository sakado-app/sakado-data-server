const util = require('../util');

async function notes(page)
{
    await util.goTo(page, 'Notes');

    await page.waitFor('#GInterface\\.Instances\\[1\\]_colonne_1');

    let lastMarks = await page.evaluate(() => {
        let marks = document.getElementById('GInterface.Instances[1]_colonne_1').childNodes[1].childNodes[1].childNodes[0].firstChild.childNodes;
        let result = [];

        marks.forEach(n => {
            let [ _, subject, __, mark ] = n.firstChild.childNodes;
            let date = n.childNodes[1];

            let current = new Date();

            if (date.innerText.toLowerCase() !== "aujourd'hui")
            {
                let dateSplit = date.innerText.substring(3).trim().split('/');

                current.setDate(parseInt(dateSplit[0]));
                current.setMonth(parseInt(dateSplit[1]));
            }

            current.setHours(0);
            current.setMonth(0);
            current.setSeconds(0);
            current.setMilliseconds(0);

            result.push({
                subject: subject.innerText.trim(),
                mark: mark.innerText.trim().replace(' ', ''),
                time: current.getTime()
            });
        });

        return Promise.resolve(result);
    });

    await util.goTo(page, 'Détail des notes');
    await util.waitForLoading(page);
    await page.waitFor('#GInterface\\.Instances\\[1\\]\\.Instances\\[1\\]_piedDeListe');

    let averages = await page.evaluate(() => {
        let averages = document.getElementById('GInterface.Instances[1].Instances[1]_piedDeListe').innerText.split('\n');
        let result = [];

        for (let i = 0; i < 2; i++) {
            let m = averages[i];
            result.push(m.substring(m.indexOf(':') + 2, m.length).trim());
        }

        return Promise.resolve({
            student: parseFloat(result[0].replace(',', '.')),
            studentClass: parseFloat(result[1].replace(',', '.'))
        });
    });

    return {
        lastMarks,
        averages
    };
}

module.exports = notes;
