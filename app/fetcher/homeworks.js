/*
 *  Sakado, an app for school
 *  Copyright (C) 2017 Adrien 'Litarvan' Navratil
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

async function homeworks(page)
{
    await page.mouse.click(200, 40);
    // await page.waitFor(".ElementPourNavigation.AlignementGauche.AvecMain.FondBlanc");

    await page.waitFor("#GInterface\\.Instances\\[1\\]\\.Instances\\[0\\]_GrilleCalendrier");
    await page.waitFor(".Image_Bandeau_Deployer");
    await page.click(".Image_Bandeau_Deployer");
    // await page.waitFor(".jIECheckBox_Conteneur");

    return await page.evaluate(function()
    {
        // UTIL START
        const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

        function dig(element, times)
        {
            for (let i = 0; i < times; i++)
            {
                element = element.firstChild;
            }

            return element;
        }
        // UTIL END

        let homeworksArray = [];

        const lines = document.querySelector(".Tableau").firstChild.childNodes;
        for (let week = 0; week < 2; week++)
        {
            for (let dayN = 0; dayN < 6 /* no work at sunday */; dayN++)
            {
                const day = lines[week * 2].childNodes[dayN];
                let entry = lines[week * 2 + 1].childNodes[dayN];

                const homeworks = entry.querySelectorAll(".ElementPourNavigation.AlignementGauche.AvecMain.FondBlanc");

                for (let i = 0; i < homeworks.length; i++)
                {
                    const homework = homeworks[i];

                    const [subject, subContent] = dig(homework, 4).childNodes;
                    const [since, content] = dig(subContent, 7).childNodes;

                    let current = new Date();
                    let splitDate = day.innerText.trim().toLowerCase().split(' ');

                    current.setDate(parseInt(splitDate[1]));
                    current.setMonth(MONTHS.indexOf(splitDate[2]) + 1);
                    current.setHours(0);
                    current.setMonth(0);
                    current.setSeconds(0);
                    current.setMilliseconds(0);

                    homeworksArray.push({
                        subject: subject.innerText.trim(),
                        content: content.innerText.trim(),
                        time: current.getTime()
                    });
                }
            }
        }

        return Promise.resolve(homeworksArray);
    });
}

module.exports = homeworks;