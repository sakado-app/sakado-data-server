async function fetchUser(page)
{
    let [studentClass, name, avatar] = await page.evaluate(function() {
        let content = document.getElementById("GInterface.Instances[0]_aideApresConnexion").innerText;
        let full = content.split('-')[1].trim();

        let studentClass = full.substring(full.indexOf('(') + 1, full.indexOf(')'));
        let name = full.substring(0, full.indexOf('(') - 1);
        let avatar = document.querySelector("img").src;

        return [studentClass, name, avatar];
    });

    return { studentClass, name, avatar };
}

module.exports = fetchUser;