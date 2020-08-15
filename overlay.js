chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.greeting == "hello")
            sendResponse({farewell: "goodbye"});

        const div = document.createElement('div');
        div.style = "position: fixed; left: 0; top: 0; width: 100%; height: 100%; opacity: 50%; background-color: gray;";
        div.id = "evans-div"
        document.body.appendChild(div);

        const searchInput = document.createElement('input');
        searchInput.id = "searchInput";
        
        // document.body.appendChild(`<div style="ition:posabsolute;
        // left: 0;
        // top: 0;
        // width: 100%;
        // height: 100%;
        // opacity: 50%;
        // background-color: gray;"> TEST DIV </div>`)
    }
);


`
<input 
    id="searchInput"
    name="searchInput" 
    placeholder="Search" 
    class="bg-white h-12 px-8 pr-10 rounded-full text-lg shadow-lg focus:outline-none" 
    autocomplete="off"
>
`