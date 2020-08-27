chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.userSearch && request.userSearch.length) {
      chrome.bookmarks.search(request.userSearch, results => {
        sendResponse(results);
      });
    } else if (request.url) {
        let queryUrl;
        if (request.url.split('/').length > 4) {
          // workaround for chrome bug
          // remove the / at the end of the url
          queryUrl = request.url.replace(/\/$/, "");
        } else {
          queryUrl = request.url
        }
        chrome.tabs.query({url: queryUrl}, e => {
        if (e.length) { // if the tab exists, go to it
          chrome.tabs.update(e[0].id, {active: true});
          // sendResponse(e);
        } else { // else, open a new tab
          chrome.tabs.create({url: request.url, active: true});
          // sendResponse([]);
        }
      });
    } else {
      sendResponse([]);
    }
    // the trick was to return true from the addListener function, mind blown
    return true
  }
);


