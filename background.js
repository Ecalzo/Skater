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


function searchBookmarks(query) {
  console.log('searching bookmarks');
  if (query.length) {
    return new Promise((resolve, _reject) => {
      chrome.bookmarks.search(query, resolve);
    });
  } else {
      return Promise.resolve([]); 
  }
}