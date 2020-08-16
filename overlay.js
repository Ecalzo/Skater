console.log('test');
document.addEventListener('keydown', event => {
    if (event.altKey && event.key === 'l') {
        console.log('test');
        createOverlay();
        getSearchInputElement().focus();

        const searchInput = getSearchInputElement();
        searchInput.addEventListener('keyup', async function(event) {
            const query = searchInput.value;
            const bookmarkSearchResults = await searchBookmarks(query);
            console.log(bookmarkSearchResults)
            // refine results
            if (Array.isArray(bookmarkSearchResults)) {
                const refinedResults = refineResults(bookmarkSearchResults, query);
                console.log(refinedResults);
                updateSearchText(refinedResults);
                updateLinkEventListeners();
                if (event.key === "Enter") {
                    // go to first event in the list
                    const top_result = refinedResults[0];
                    window.open(top_result.url)
                }
            }
            if (event.key === "Escape") {
                destroyOverlay();
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

function getSearchWrapperElement() {
    return document.getElementById("searchWrapperDiv");
}

function getOverlayDiv() {
    return document.getElementById("skater-overlay");
}

function createOverlay() {
    const searchIcon = createSearchIcon();
    const overlayDiv = createOverlayDiv();
    const searchInput = createSearchInput();
    const resultsDiv = createSearchResultsList();
    const searchWrapperDiv= createSearchWrapperDiv();

    searchWrapperDiv.appendChild(searchIcon);
    searchWrapperDiv.appendChild(searchInput);
    searchWrapperDiv.appendChild(resultsDiv);
    overlayDiv.appendChild(searchWrapperDiv);
    // append all to document
    document.body.appendChild(overlayDiv);
}

function destroyOverlay() {
    const overlayDiv = getOverlayDiv();
    overlayDiv.parentNode.removeChild(overlayDiv);
}

function createOverlayDiv () {
    const overlayDiv = document.createElement('div');
    overlayDiv.style = "position: fixed; left: 0; top: 0; width: 100%; height: 100%; background: rgba(204, 204, 204, 0.5);";
    overlayDiv.id = "skater-overlay"
    return overlayDiv
}

function createSearchIcon() {
    const searchIcon = document.createElement('img');
    searchIcon.class = "search-icon";
    searchIcon.src = "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDU2Ljk2NiA1Ni45NjYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDU2Ljk2NiA1Ni45NjY7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4Ij4KPHBhdGggZD0iTTU1LjE0Niw1MS44ODdMNDEuNTg4LDM3Ljc4NmMzLjQ4Ni00LjE0NCw1LjM5Ni05LjM1OCw1LjM5Ni0xNC43ODZjMC0xMi42ODItMTAuMzE4LTIzLTIzLTIzcy0yMywxMC4zMTgtMjMsMjMgIHMxMC4zMTgsMjMsMjMsMjNjNC43NjEsMCw5LjI5OC0xLjQzNiwxMy4xNzctNC4xNjJsMTMuNjYxLDE0LjIwOGMwLjU3MSwwLjU5MywxLjMzOSwwLjkyLDIuMTYyLDAuOTIgIGMwLjc3OSwwLDEuNTE4LTAuMjk3LDIuMDc5LTAuODM3QzU2LjI1NSw1NC45ODIsNTYuMjkzLDUzLjA4LDU1LjE0Niw1MS44ODd6IE0yMy45ODQsNmM5LjM3NCwwLDE3LDcuNjI2LDE3LDE3cy03LjYyNiwxNy0xNywxNyAgcy0xNy03LjYyNi0xNy0xN1MxNC42MSw2LDIzLjk4NCw2eiIgZmlsbD0iIzAwMDAwMCIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K"
    searchIcon.style = "position: absolute; top: 20px; left: 8px; width: 18px; opacity: 50%"
    return searchIcon
}


function createSearchInput() {
    const searchInput = document.createElement('input');
    searchInput.id = "searchInput";
    searchInput.class = "";
    searchInput.style = "height: 60px; width: 100%; padding: 2px 23px 2px 35px; background-color: #f5f5f5;"
    searchInput.style.border = "0px";
    searchInput.style.outline = "none";
    searchInput.style['border-width'] = "0px";
    searchInput.autocomplete = "off";
    searchInput.placeholder="Search";
    return searchInput
}

function createSearchWrapperDiv() {
    const searchWrapperDiv = document.createElement('div');
    searchWrapperDiv.id = "searchWrapperDiv";
    searchWrapperDiv.style = "width:400px; margin:auto; position: absolute; top: 50%; left: 40%; margin-right: -50%; transform: translate(-50%, -%50);"
    searchWrapperDiv.style.padding = "2px";
    searchWrapperDiv.style.border = "1px solid grey";
    searchWrapperDiv.style['border-radius'] = "8px";
    searchWrapperDiv.style['background-color'] = "#f5f5f5";
    searchWrapperDiv.style['box-shadow'] = "-12px 12px 2px 0px rgba(0, 0, 0, .2);"
    return searchWrapperDiv
}

function createSearchResultsList() {
    const resultsDiv = document.createElement('div');
    resultsDiv.id = "searchResults";
    resultsDiv.style = "padding: 20px; padding 20px; background-color: #f5f5f5;"
    resultsDiv.style.visibility = "hidden";
    resultsDiv.style.padding = "0px";
    return resultsDiv
}

function ensureResultsListIsVisible() {
    const searchResultsElement = getSearchResultsElement();
    searchResultsElement.style.visibility = "visible";
    searchResultsElement.style.padding = "20px";
    console.log('made visible');
}

function ensureResultsListIsHidden() {
    const searchResultsElement = getSearchResultsElement();
    searchResultsElement.style.visibility = "hidden";
    searchResultsElement.style.padding = "0px";
    console.log('made invisible');
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
    if (results.length) {
        ensureResultsListIsVisible();
        results.forEach(result => {
            resultsDiv.appendChild(
                createListItem(result)
            );
        });
    } else {
        ensureResultsListIsHidden();
    };
}

function createListItem(result) {
    const listElement = document.createElement('div');
    const listURL = document.createElement('a');
    listURL.class = "link";
    listElement.class = "searchResultItem"

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
