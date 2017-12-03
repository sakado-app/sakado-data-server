const response = require('../response');

async function edt(id, session)
{
    let page = session.page;

    await page.setViewport({
        width: 1920,
        height: 1080
    });

    await page.mouse.click(450, 40);
    await page.waitFor('table.Cours');

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

            ['top', 'left', 'width', 'height'].forEach(name => {
                let style = parentStyle[name];
                computed[name] = parseInt(style.substring(0, style.length - 2))
            });

            coursArray.push(computed);
        }

        return Promise.resolve(coursArray);
    });

    await page.screenshot({ path: 'edt.png', fullPage: true });

    return response.success(id, {
        result: cours
    });
}

module.exports = (id, session, _) => edt(id, session);