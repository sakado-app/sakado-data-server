const util = require('../util');

const COURS_LENGTH = 308;
const COURS_HEIGHT = 75;

/*
    Parts of this code are taken from https://github.com/ColbertApp/app/blob/master/app/src/main/assets/app.js
    By Théophile 'FliiFe' Cailliau <theophile.cailliau@gmail.com>
 */

async function edt(session)
{
    console.log('(Checking for expire...)');
    await util.checkForExpire(session);

    const page = session.page;

    await page.setViewport({
        width: 1920,
        height: 1080
    });

    console.log('\n-------> EDT START');
    console.log('Clicking on link...');
    await page.evaluate(() => {
        let link = Array.prototype.slice.call(document.getElementsByTagName('li')).filter(function(elem) {
            return elem.getAttribute('aria-label') === 'Emploi du temps';
        })[0];

        link.focus();
        link.click();
    });

    console.log('Waiting for EDT...');
    await waitForLoading(page);

    await skipEmptyWeeks(page);

    let first = await currentWeek(page);
    let edt = [];

    console.log('Reading first week...');
    edt[0] = await readWeek(page);

    if (await nextWeek(page))
    {
        await skipEmptyWeeks(page);

        console.log('Reading second week...');
        edt[1] = await readWeek(page);
    }
    else
    {
        console.log('No need to read next week (max)');
    }

    console.log('Reverting to first real week...');
    await nextWeek(page, first);

    console.log('Done !');
    console.log(JSON.stringify(edt));

    return edt;
}

async function readWeek(page)
{
    console.log('Reading !');
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
                computed.info = process(lines[0].innerText);
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
                computed.salle = process(lines[2].innerText);
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

    console.log('Parsing shift...');
    const dayShift = await page.evaluate(() =>
        parseInt(document.getElementById("GInterface.Instances[1].Instances[1].Instances[0]_Date0").innerText.substring(5,7)));

    console.log('Processing...');
    cours.forEach(c => {
        c.length = Math.round(c.dim.height / COURS_HEIGHT);
        c.hour = Math.round(c.dim.top / COURS_HEIGHT);
        c.weekday = Math.round(c.dim.left / COURS_LENGTH);
        c.day = dayShift + c.weekday;

        delete c.dim;
    });

    console.log('Read ' + cours.length + ' cours !');
    return {
        from: dayShift,
        content: cours
    };
}

async function waitForLoading(page)
{
    console.log('Waiting for loading...');

    await util.sleep(500);
    await page.waitForFunction(() => GInterface &&
            GInterface.Instances &&
            GInterface.Instances.length >= 2 &&
            GInterface.Instances[1] &&
            GInterface.Instances[1].donneesGrille &&
            GInterface.Instances[1].donneesGrille.listeCours &&
            GInterface.Instances[1].donneesGrille.listeCours.ListeElements &&
            GInterface.Instances[1].donneesGrille.listeCours.ListeElements.length !== undefined &&
            document.getElementsByClassName('Image_Attendre').length === 0);

    console.log('Loaded !');
}

async function nextWeek(page, id)
{
    console.log('Skipping week...');
    let next = id == null ? await currentWeek(page) + 1 : id;

    if (next > 44)
    {
        return false;
    }

    console.log('Setting week : ' + next);
    await page.evaluate((id) => {
        GInterface.Instances[1].Instances[0].SetSelection(id);
    }, next);

    await waitForLoading(page);

    return true;
}

async function skipEmptyWeeks(page)
{
    console.log('Skipping empty weeks...');
    while (await isWeekEmpty(page))
    {
        if (await nextWeek(page)) break;
    }
}

async function currentWeek(page)
{
    console.log('Querying current week...');
    let result =  await page.evaluate(() => Promise.resolve(GInterface.Instances[1].Instances[0].Position));
    console.log('Current week is : ' + result);

    return result;
}

async function isWeekEmpty(page)
{
    console.log('Is week empty ?');
    let result =  await page.evaluate(() => Promise.resolve(document.querySelectorAll('table.Cours').length === 0));
    console.log('Week is empty = ' + result);

    return result;
}

module.exports = edt;