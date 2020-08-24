chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.queryBody.length) {
      chrome.bookmarks.search(request.queryBody, results => {
        console.log(results);
        sendResponse(results);
      });
    } else {
      sendResponse([]);
    }
    // the trick was to return true from the addListener function, mind blown
    return true
  }
);
