document.addEventListener('keydown', documentEvent => {
    if (documentEvent.altKey && documentEvent.key === 'l') {
        // const browser = chrome || browser;
        createOverlay();
        getSearchInputElement().focus();
        setUpInputEventListener();
    } else if (getSearchInputElement()) {
        const focusedElement = document.activeElement;
        switch(documentEvent.key) {
            case "Up":
            case "ArrowUp":
                // move to last search result or input
                // FIXME functionize
                if (focusedElement.getAttribute('class') === 'skater-link skater-result-0') {
                    focusInput();
                    // FIXME: implement preventDefault better
                    documentEvent.preventDefault();
                    return true
                } else if (focusedElement.isSameNode(getSearchInputElement())) {
                    return true
                } else {
                    // move to previous result
                    moveUpOneResult();
                    documentEvent.preventDefault();
                    return true
                }
            case "Down":
            case "ArrowDown":
                    // move to next search result
                    // FIXME: check if this is the last element
                    documentEvent.preventDefault();
                    moveDownOneResult();
                    return true
        }
    }
    if (documentEvent.key === "Escape") {
        destroyOverlay();
    }
});

function setUpInputEventListener() {
    const searchInput = getSearchInputElement();
    searchInput.addEventListener('keyup', async function(inputEvent) {
        const query = searchInput.value;
        const bookmarkSearchResults = await searchBookmarks(query);
        // refine results
        if (Array.isArray(bookmarkSearchResults)) {
            const refinedResults = refineResults(bookmarkSearchResults, query);
            nodes = updateSearchText(refinedResults);
            if (refinedResults.length) {

                updateSearchResultsCSS(0);
                // Handle keydown at the searchInput element
                switch(inputEvent.key) {
                    case "Enter":
                        // go to first inputEvent in the list
                        const top_result = refinedResults[0];
                        // TODO use chrome.tabs.create by sending this as message to background.js
                        if (inputEvent.ctrlKey){
                            // open in same window
                        } else {
                            window.open(top_result.url);
                            destroyOverlay();
                        }
                }
            }
        }
    });
}

function moveUpOneResult() {
    const focusedElement = document.activeElement;
    const indexOfLastFocus = focusedElement.getAttribute('class').split('-');
    const index = parseInt(indexOfLastFocus[indexOfLastFocus.length - 1]) - 1;
    document.querySelector(`.skater-result-${index}`).focus();
    updateSearchResultsCSS(index);
}

function moveDownOneResult() {
    const focusedElement = document.activeElement;
    let index;
    if (focusedElement.isSameNode(getSearchInputElement())) {
        document.querySelector('.skater-result-1').focus();
        index = 1;
    } else {
        // move to next search result
        const indexOfLastFocus = focusedElement.getAttribute('class').split('-');
        index = parseInt(indexOfLastFocus[indexOfLastFocus.length - 1]) + 1;
        document.querySelector(`.skater-result-${index}`).focus();
    }
    updateSearchResultsCSS(index);
}

function updateSearchResultsCSS(index) {
    const searchElements = getSearchResultsElementChildren();
    const focusedElement = document.querySelector(`.skater-result-${index}`);
    searchElements.forEach(e => {
        resetListElementCSS(e.parentElement);
    });
    // color focused element
    // setFocusedElementCSS
    focusedElement.parentElement.style['background-position-y'] = '100%';
    focusedElement.style.color = 'black';
    focusedElement.style.outline = "none";
}


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

function getSearchResultsElementChildren() {
    return document.querySelectorAll(".skater-link");
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
    searchIcon.setAttribute('class', "search-icon");
    searchIcon.src = "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDU2Ljk2NiA1Ni45NjYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDU2Ljk2NiA1Ni45NjY7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4Ij4KPHBhdGggZD0iTTU1LjE0Niw1MS44ODdMNDEuNTg4LDM3Ljc4NmMzLjQ4Ni00LjE0NCw1LjM5Ni05LjM1OCw1LjM5Ni0xNC43ODZjMC0xMi42ODItMTAuMzE4LTIzLTIzLTIzcy0yMywxMC4zMTgtMjMsMjMgIHMxMC4zMTgsMjMsMjMsMjNjNC43NjEsMCw5LjI5OC0xLjQzNiwxMy4xNzctNC4xNjJsMTMuNjYxLDE0LjIwOGMwLjU3MSwwLjU5MywxLjMzOSwwLjkyLDIuMTYyLDAuOTIgIGMwLjc3OSwwLDEuNTE4LTAuMjk3LDIuMDc5LTAuODM3QzU2LjI1NSw1NC45ODIsNTYuMjkzLDUzLjA4LDU1LjE0Niw1MS44ODd6IE0yMy45ODQsNmM5LjM3NCwwLDE3LDcuNjI2LDE3LDE3cy03LjYyNiwxNy0xNywxNyAgcy0xNy03LjYyNi0xNy0xN1MxNC42MSw2LDIzLjk4NCw2eiIgZmlsbD0iIzAwMDAwMCIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K"
    searchIcon.style = "position: absolute; top: 25px; left: 8px; width: 18px; opacity: 50%"
    return searchIcon
}


function createSearchInput() {
    const searchInput = document.createElement('input');
    searchInput.id = "searchInput";
    searchInput.setAttribute('class', "");
    searchInput.style = "height: 60px; width: 100%; padding: 2px 23px 2px 35px; background-color: #f5f5f5; font-size:19px; font-family: Helvetica Neue,Helvetica,Arial,sans-serif;"
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
    searchWrapperDiv.style.padding = "18px";
    searchWrapperDiv.style.border = "1px solid grey";
    searchWrapperDiv.style['border-radius'] = "8px";
    searchWrapperDiv.style['background-color'] = "#f5f5f5";
    searchWrapperDiv.style['box-shadow'] = "-13px 13px 16px 1px rgba(0, 0, 0, 0.2)"
    return searchWrapperDiv
}

function createSearchResultsList() {
    const resultsDiv = document.createElement('div');
    resultsDiv.id = "searchResults";
    resultsDiv.style = "padding 20px; background-color: #f5f5f5; font-size:17px; font-family: Helvetica Neue,Helvetica,Arial,sans-serif;"
    resultsDiv.style.visibility = "hidden";
    resultsDiv.style.padding = "0px";
    return resultsDiv
}

function resetListElementCSS(listElement) {
    listElement.style['background-position-y'] = "-0%";
    listElement.style['background-image'] = 'linear-gradient(#f5f5f5 50%, #c6f6d5 50%)';
    listElement.style['background-color'] = '#f5f5f5';
    listElement.style['transition'] = 'background 300ms ease';
    listElement.style['background-size'] = 'auto 175%';
    listElement.style.padding = '4px 0px 4px 0px';
}

function createListItem(result, index) {
    const listElement = document.createElement('div');
    const listURL = document.createElement('a');
    const listIMG = document.createElement('img');

    var matches = result.url.match(/^https?\:\/\/(?:www\.)?([^\/?#]+)(?:[\/?#]|$)/i);
    var domain = matches && matches[1] // domain is null if no matches found

    listIMG.src = `https://www.google.com/s2/favicons?domain_url=${domain}`;
    listIMG.style.padding = '0% 5% 0% 5%';
    listIMG.setAttribute('class', 'domain-icon');

    listURL.setAttribute('class', `skater-link skater-result-${index}`);
    listURL.style.color = "#81b3d2";

    listElement.setAttribute('class', `searchResultItem`);
    resetListElementCSS(listElement);

    if (result.title.length > 27) {
        listURL.innerHTML = result.title.substring(0, 27) + '...';
    }
    else {
        listURL.innerHTML = result.title;
    }
    listURL.href = result.url;
    listElement.appendChild(listIMG);
    listElement.appendChild(listURL);
    return listElement
}

function ensureResultsListIsVisible() {
    const searchResultsElement = getSearchResultsElement();
    searchResultsElement.style.visibility = "visible";
    searchResultsElement.style.padding = "10px 10px 10px 10px";
}

function ensureResultsListIsHidden() {
    const searchResultsElement = getSearchResultsElement();
    searchResultsElement.style.visibility = "hidden";
    searchResultsElement.style.padding = "0px";
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
  
  
// function updateLinkEventListeners() {
//     const links = document.querySelectorAll(".link");
//     if (links.length) {
//         links.forEach(link => {
//         link.addEventListener('click', event => {
//             const ctrlPressed = (event.ctrlKey || event.metaKey);
//             const url = event.target.href;
//             // TODO: Decide if this is necessary
//             chrome.tabs.create({'url': url, active: !ctrlPressed});
//         }, false); 
//     });
// }
// }

function updateSearchText(results) {
    const resultsDiv = getSearchResultsElement();
    // wipes the unordered list
    resultsDiv.innerHTML = '';
    if (results.length) {
        ensureResultsListIsVisible();
        let index = 0;
        results.forEach(result => {
            resultsDiv.appendChild(createListItem(result, index));
            index += 1;
        });
    } else {
        ensureResultsListIsHidden();
    };
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




