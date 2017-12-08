const response = require('../response');
const util = require('../util');

const COURS_LENGTH = 308;
const COURS_HEIGHT = 75;

async function edt(id, session)
{
    await util.checkForExpire(session);

    let page = session.page;

    await page.setViewport({
        width: 1920,
        height: 1080
    });

    await page.mouse.move(450, 40);
    await sleep(1500);
    await page.mouse.down();
    await sleep(4500);
    await page.waitFor('table.Cours');
    await page.waitFor('.AlignementMilieu.Insecable');

    let cours = await page.evaluate(function() {
        let process = str => str.trim().replace('\n', '');

        let coursArray = [];
        let result = document.querySelectorAll('table.Cours');

        for (let i = 0; i < result.length; i++) {
            let cours = result[i];
            let computed = {};
            let lines = Array.from(cours.querySelectorAll('div.AlignementMilieu'));

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
                let style = parentStyle[name];
                computed.dim[name] = parseInt(style.substring(0, style.length - 2))
            });

            coursArray.push(computed);
        }

        return Promise.resolve(coursArray);
    });

    cours.forEach(c => {
        c.length = Math.round(c.dim.height / COURS_HEIGHT);
        c.hour = Math.round(c.dim.top / COURS_HEIGHT);
        c.day = Math.round(c.dim.left / COURS_LENGTH);

        delete c.dim;
    });

    await page.screenshot({ path: 'edt.png', fullPage: true });

    return response.success(id, {
        result: {
            cours: cours
        }
    });
}

function sleep(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = (id, session, _) => edt(id, session);