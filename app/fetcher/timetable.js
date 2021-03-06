const util = require('../util');

const LESSON_LENGTH = 308;
const LESSON_HEIGHT = 75;

/*
    Parts of this code are taken from https://github.com/ColbertApp/app/blob/master/app/src/main/assets/app.js
    By Théophile 'FliiFe' Cailliau <theophile.cailliau@gmail.com>
 */

async function timetable(page)
{
    await page.setViewport({
        width: 1920,
        height: 1080
    });

    await util.goTo(page, 'Emploi du temps');

    await waitForLoading(page);
    await skipEmptyWeeks(page);

    let first = await currentWeek(page);
    let timetable = [];

    timetable[0] = await readWeek(page);

    if (await nextWeek(page))
    {
        await skipEmptyWeeks(page);
        timetable[1] = await readWeek(page);
    }

    await nextWeek(page, first);

    return timetable;
}

async function readWeek(page)
{
    const lessons = await page.evaluate(function()
    {
        const process = str => str.trim().replace('\n', '');

        let lessons = [];

        const result = document.querySelectorAll('table.Cours');

        for (let i = 0; i < result.length; i++)
        {
            const lesson = result[i];
            let computed = {};
            const lines = Array.from(lesson.querySelectorAll('div.AlignementMilieu'));

            if (lines[0].classList.contains('FondBlanc'))
            {
                let info = process(lines[0].innerText);

                if (info === 'Prof. absent' || info === 'Cours annulé')
                {
                    computed.away = true;
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
                computed.teacher = process(lines[1].innerText);

                if (computed.teacher === computed.name)
                {
                    computed.teacher = process(lines[2].innerText);
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
                let room = process(lines[2].innerText);

                if (!room.startsWith('<'))
                {
                    computed.room = room;
                }
            }

            let parentStyle = lesson.parentElement.parentElement.parentElement.style;
            computed.dim = {};

            ['top', 'left', 'width', 'height'].forEach(name => {
                const style = parentStyle[name];
                computed.dim[name] = parseInt(style.substring(0, style.length - 2))
            });

            lessons.push(computed);
        }

        return Promise.resolve(lessons);
    });

    /*const dayShift = await page.evaluate(() =>
        parseInt(document.getElementById("GInterface.Instances[1].Instances[1].Instances[0]_Date0").innerText.substring(5,7)));*/

    for (const c of lessons)
    {
        let { from, to } = toDate(await currentWeek(page), /*dayShift + */Math.round(c.dim.left / LESSON_LENGTH), Math.round(c.dim.top / LESSON_HEIGHT * 2) / 2, Math.round(c.dim.height / LESSON_HEIGHT * 2) / 2);
        c.from = from;
        c.to = to;

        delete c.dim;
    }

    let from = undefined;
    let to = undefined;

    if (lessons.length > 0)
    {
        let current = new Date(lessons[0].from);
        current.setHours(0);
        current.setMinutes(0);
        current.setSeconds(0);
        current.setMilliseconds(0);

        from = current.getTime();

        current.setDate(current.getDate() + 5);

        to = current.getTime();
    }

    return {
        from,
        to,
        content: lessons
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

function toDate(week, day, hour, length)
{
    let current = new Date();

    /*if (day + 7 < current.getDate())
    {
        current.setMonth(current.getMonth() + 1);
    }*/

    let half = hour % 1 > 0;

    current.setMonth(0);
    current.setDate((week - 18) * 7 + 1 + day);
    current.setHours((half ? hour - 0.5 : hour) + 8);
    current.setMinutes(half ? 30 : 0);
    current.setSeconds(0);
    current.setMilliseconds(0);

    let from = current.getTime();

    half = length % 1 > 0;

    current.setHours(current.getHours() + (half ? length - 0.5 : length));
    if (half) current.setMinutes(current.getMinutes() + 30);

    return {
        from,
        to: current.getTime()
    };
}

module.exports = timetable;