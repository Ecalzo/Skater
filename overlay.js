
document.addEventListener('keydown', event => {
    if (event.ctrlKey && event.key === 'l') {
        createOverlay();
        getSearchInputElement().focus();

        // now the magic
        const searchInput = getSearchInputElement();
        searchInput.addEventListener('keyup', async function(event) {
            const query = searchInput.value;
            const bookmarkSearchResults = await searchBookmarks(query);
            console.log(bookmarkSearchResults)
            // refine results
            if (Array.isArray(bookmarkSearchResults) && query.length > 1) {
                const refinedResults = refineResults(bookmarkSearchResults, query);
                console.log(refinedResults);
                updateSearchText(refinedResults);
                updateLinkEventListeners();
            }
            if (event.key === "Enter") {
                // go to first event in the list
                const top_result = refinedResults[0];
                window.open(top_result.url)
            }
        });
    }
});

function getSearchInputElement() {
    return document.getElementById("searchInput");
}

function getSearchResultsElement() {
    return document.getElementById("searchResults");
}

function createOverlay() {
    const overlayDiv = createOverlayDiv();
    const searchInput = createSearchInput();
    const resultsDiv = createSearchResultsList();
    const searchWrapperDiv= createSearchWrapperDiv();

    searchWrapperDiv.appendChild(searchInput);
    searchWrapperDiv.appendChild(resultsDiv);
    overlayDiv.appendChild(searchWrapperDiv);
    document.body.appendChild(overlayDiv);
}

function createOverlayDiv () {
    const overlayDiv = document.createElement('div');
    overlayDiv.style = "position: fixed; left: 0; top: 0; width: 100%; height: 100%; background: rgba(204, 204, 204, 0.5);";
    overlayDiv.id = "evans-div"
    return overlayDiv
}

function createSearchInput() {
    const searchInput = document.createElement('input');
    searchInput.id = "searchInput";
    searchInput.class = "";
    searchInput.autocomplete = "off";
    return searchInput
}

function createSearchWrapperDiv() {
    const searchDivWrapper = document.createElement('div');
    searchDivWrapper.style = "margin:auto; position: absolute; top: 50%; left: 50%; margin-right: -50%; transform: translate(-50%, -%50);"
    searchDivWrapper.id = "searchDivWrapper";
    return searchDivWrapper
}

function createSearchResultsList() {
    const resultsDiv = document.createElement('ul');
    resultsDiv.id = "searchResults";
    return resultsDiv
}

function refineResults(searchResults, query) {
    return searchResults.filter(result => {
      // cuts bookmark Title down to a substring for closer matching
      const queryLen = query.length;
      const queryLower = query.toLowerCase();
      const bookmarkTitle = result.title.substring(0, queryLen).toLowerCase();
      return bookmarkTitle.includes(queryLower) & result.hasOwnProperty('url');
    });
  }
  
  
function updateLinkEventListeners() {
    const links = document.querySelectorAll(".link");
    if (links.length) {
        links.forEach(link => {
        link.addEventListener('click', event => {
            const ctrlPressed = (event.ctrlKey || event.metaKey);
            const url = event.target.href;
            chrome.tabs.create({'url': url, active: !ctrlPressed});
        }, false); 
    });
}
}

function updateSearchText(results) {
    const resultsDiv = getSearchResultsElement();
    // wipes the unordered list
    resultsDiv.innerHTML = '';
    results.forEach(result => {
        resultsDiv.appendChild(
            createListItem(result)
        );
    });
}

function createListItem(result) {
    const listElement = document.createElement('li');
    const listURL = document.createElement('a');
    listURL.class = "link";

    if (result.title.length > 27) {
        listURL.innerHTML = result.title.substring(0, 27) + '...';
    }
    else {
        listURL.innerHTML = result.title;
    }
    listURL.href = result.url;
    listElement.appendChild(listURL);
    return listElement
}

function focusInput() {
    getSearchInputElement().focus();
}

function searchBookmarks(query) {
    if (query.length > 1) {
        return new Promise((resolve, _reject) => {
            chrome.runtime.sendMessage({queryBody: query}, resolve);
        });
    } else {
        return Promise.resolve([]);
    }
}
