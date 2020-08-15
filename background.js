chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // if (request.queryBody.length) {
    chrome.bookmarks.search(request.queryBody, results => {
      let title;
      title = results[0].title;
      sendResponse({text: title});
      // there is an issue with using sendResponse inside of this async? function
      // sendResponse({text: 'fake response'});

      console.log(request.queryBody);
      console.log(title);
      console.log(results);
    });
    // sendResponse({text: 'fake response'});

    // const results = await searchBookmarks(request.queryBody);
    // console.log(results);
    //   // sendResponse(results[0]);
    // } else {
    //     // return Promise.resolve([]);
    //   sendResponse({text: ''});
    // }
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