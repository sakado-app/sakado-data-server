// By Ariex : https://gist.github.com/Ariex/6f425fbcab09e13d8bec39aba7c4a9b5

const Page = require('puppeteer/lib/Page');

// the following 2 methods are originally from: https://github.com/GoogleChrome/puppeteer/issues/85#issuecomment-341743259, with some modification to fit puppeteerv1.0.0
async function newPageWithNewContext(browser)
{
    const { browserContextId } = await browser._connection.send('Target.createBrowserContext');
    const { targetId } = await browser._connection.send('Target.createTarget', { url: 'about:blank', browserContextId });

    const target = await browser._targets.get(targetId);
    const client = await browser._connection.createSession(targetId);
    const page = await Page.create(client, /*target,*/ browser._ignoreHTTPSErrors, browser._appMode, browser._screenshotTaskQueue);

    page.browserContextId = browserContextId;

    return page;
}

async function closePage(browser, page)
{
    if (page.browserContextId != undefined)
    {
        await browser._connection.send('Target.disposeBrowserContext', { browserContextId: page.browserContextId });
    }

    await page.close();
}

module.exports = async browser =>
{
    let page = await newPageWithNewContext(browser);
    page.endIncognito = async() => closePage(browser, page);

    return page;
};