chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    console.log('starting');
    
    if (changeInfo.status == 'complete' && tab.active) {
        console.log('if trigger');
        
      // do your things
  
    }
});


// chrome.tabs.onUpdated.addListener(() => {
//     // document.addEventListener('DOMContentLoaded', () => {
//     //     document.addEventListener('keydown', event => {
//     //         if (event.ctrlKey && event.key === 'l') {
//     //             obj = {greeting: "hello"};
//     //             sendMessage(obj);
//     //         }
//     //     });
//     // })
    
// });

// function sendMessage(obj) {
//     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//         chrome.tabs.sendMessage(tabs[0].id, obj, function(response) {
//           console.log(response.farewell);
//         });
//     });
// }

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.queryBody.length) {
      // sendResponse({text: "tada!"})
      // return new Promise((resolve, _reject) => {
      //   chrome.bookmarks.search(query, resolve);
        // });
      chrome.bookmarks.search(request.queryBody, results => {
        console.log(results);
        sendResponse({text: "tada!"})});
    } else {
        // return Promise.resolve([]);
      sendResponse({text: ''});
    }
  }
);


function searchBookmarks() {
  if (query.length) {
    return new Promise((resolve, _reject) => {
      chrome.bookmarks.search(query, resolve);
    });
  } else {
      return Promise.resolve([]); 
  }
}