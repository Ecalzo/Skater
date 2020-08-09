chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log("this is firing");
        document.body.insertAdjacentHTML('beforeend', "<div> BIG DIV </div>"); // my extension
    }
);