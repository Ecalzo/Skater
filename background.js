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

function sendMessage(obj) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, obj, function(response) {
          console.log(response.farewell);
        });
    });
}
