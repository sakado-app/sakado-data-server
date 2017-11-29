async function homeworks(id, session)
{
    let page = session.page;

    await page.mouse.click(200, 40);
    await page.waitFor(".ElementPourNavigation.AlignementGauche.AvecMain.FondBlanc");

    let result = await page.evaluate(function() {
        let homeworks = document.querySelectorAll(".ElementPourNavigation.AlignementGauche.AvecMain.FondBlanc");
        let homeworksArray = [];

        for (let i = 0; i < result.length; i++) {
            let homework = homeworks[i];
        }
    });

    await page.screenshot({ path: 'homeworks.png', fullPage: true });
}

module.exports = (id, session, params) => homeworks(id, session);