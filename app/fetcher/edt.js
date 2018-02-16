const util = require('../util');

const COURS_LENGTH = 308;
const COURS_HEIGHT = 75;

/*
    Parts of this code are taken from https://github.com/ColbertApp/app/blob/master/app/src/main/assets/app.js
    By Théophile 'FliiFe' Cailliau <theophile.cailliau@gmail.com>
 */

async function edt(page)
{
    await page.setViewport({
        width: 1920,
        height: 1080
    });

    await util.goTo(page, 'Emploi du temps');

    await waitForLoading(page);
    await skipEmptyWeeks(page);

    let first = await currentWeek(page);
    let edt = [];

    edt[0] = await readWeek(page);

    if (await nextWeek(page))
    {
        await skipEmptyWeeks(page);
        edt[1] = await readWeek(page);
    }

    await nextWeek(page, first);

    return edt;
}

async function readWeek(page)
{
    const cours = await page.evaluate(function()
    {
        const process = str => str.trim().replace('\n', '');

        let coursArray = [];

        const result = document.querySelectorAll('table.Cours');

        for (let i = 0; i < result.length; i++)
        {
            const cours = result[i];
            let computed = {};
            const lines = Array.from(cours.querySelectorAll('div.AlignementMilieu'));

            if (lines[0].classList.contains('FondBlanc'))
            {
                let info = process(lines[0].innerText);

                if (info === 'Prof. absent')
                {
                    cours.away = true;
                }

                lines.splice(0, 1);
            }

            if (lines.length === 0)
            {
                continue;
            }

            computed.name = process(lines[0].innerText);

            if (computed.name === '')
            {
                continue;
            }

            if (lines.length > 1)
            {
                computed.prof = process(lines[1].innerText);

                if (computed.prof === computed.name)
                {
                    computed.prof = process(lines[2].innerText);
                    lines.splice(0, 1);
                }
            }

            if (lines.length > 2)
            {
                let second = lines[2].innerText;

                if (second.startsWith('[') || second.startsWith('<') || second.endsWith('.'))
                {
                    lines.splice(0, 1);
                }
            }

            if (lines.length > 2)
            {
                let salle = process(lines[2].innerText);

                if (!salle.startsWith('<'))
                {
                    computed.salle = salle;
                }
            }

            let parentStyle = cours.parentElement.parentElement.parentElement.style;
            computed.dim = {};

            ['top', 'left', 'width', 'height'].forEach(name => {
                const style = parentStyle[name];
                computed.dim[name] = parseInt(style.substring(0, style.length - 2))
            });

            coursArray.push(computed);
        }

        return Promise.resolve(coursArray);
    });

    const dayShift = await page.evaluate(() =>
        parseInt(document.getElementById("GInterface.Instances[1].Instances[1].Instances[0]_Date0").innerText.substring(5,7)));

    cours.forEach(c => {
        c.time = toDate(dayShift + Math.round(c.dim.left / COURS_LENGTH), Math.round(c.dim.top / COURS_HEIGHT), Math.round(c.dim.height / COURS_HEIGHT));
        delete c.dim;
    });

    let from = undefined;
    let to = undefined;

    if (cours.length > 0)
    {
        let current = new Date(cours[0].time.from);
        current.setHours(0);
        current.setMinutes(0);
        current.setSeconds(0);

        from = current.getTime();

        current.setDate(current.getDate() + 5);

        to = current.getTime();
    }

    return {
        from,
        to,
        content: cours
    };
}

async function waitForLoading(page)
{
    await util.waitForLoading(page);
    await page.waitForFunction(() => GInterface &&
            GInterface.Instances &&
            GInterface.Instances.length >= 2 &&
            GInterface.Instances[1] &&
            GInterface.Instances[1].donneesGrille &&
            GInterface.Instances[1].donneesGrille.listeCours &&
            GInterface.Instances[1].donneesGrille.listeCours.ListeElements &&
            GInterface.Instances[1].donneesGrille.listeCours.ListeElements.length !== undefined);
}

async function nextWeek(page, id)
{
    // Do not change id == null to id === null !!!
    let next = id == null ? await currentWeek(page) + 1 : id;

    if (next > 44)
    {
        return false;
    }

    await page.evaluate((id) => {
        GInterface.Instances[1].Instances[0].SetSelection(id);
    }, next);

    await waitForLoading(page);

    return true;
}

async function skipEmptyWeeks(page)
{
    while (await isWeekEmpty(page))
    {
        if (!(await nextWeek(page))) break;
    }
}

async function currentWeek(page)
{
    return await page.evaluate(() => Promise.resolve(GInterface.Instances[1].Instances[0].Position));
}

async function isWeekEmpty(page)
{
    return await page.evaluate(() => Promise.resolve(document.querySelectorAll('table.Cours').length === 0));
}

function toDate(day, hour, length)
{
    let current = new Date();

    if (day + 7 < current.getDate())
    {
        current.setMonth(current.getMonth() + 1);
    }

    current.setDate(day);
    current.setHours(hour + 8);
    current.setMinutes(0);
    current.setSeconds(0);

    let from = current.getTime();

    current.setHours(current.getHours() + length);

    return {
        from,
        to: current.getTime()
    };
}

module.exports = edt;