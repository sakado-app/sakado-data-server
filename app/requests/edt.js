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
        let coursArray = [];
        let result = document.querySelectorAll("table.Cours");

        for (let i = 0; i < result.length; i++) {
            let cours = result[i];
            let inner = cours.innerText.split('\n');

            coursArray[i] = {
                name: inner[0],
                prof: inner[1],
                content: cours.innerHTML
            };
        }

        return Promise.resolve(coursArray);
    });

    await page.screenshot({ path: 'edt.png', fullPage: true });

    return response.success(id, {
        result: cours
    });
}

module.exports = (id, session, params) => edt(id, session);