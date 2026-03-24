const bookmark = {
    async init() {
        // save current tab title and URL
        chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
            chrome.storage.local.set({bm_title: tabs[0].title}).then(() => {
                // alert(tabs[0].title);
            });
            chrome.storage.local.set({bm_url: tabs[0].url}).then(() => {
                // alert(tabs[0].url);
            });
        });
        // open new tab
        chrome.tabs.create({url: chrome.runtime.getURL('index.html')});
    },
};
// Extension event click
chrome.action.onClicked.addListener(() => {
    bookmark.init();
});
