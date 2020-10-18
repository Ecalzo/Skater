const {isValidInputEvent} = require('../src/utils.js');

chrome.runtime.onMessage.addListener(
    async function(a, b, sendResponse) {
        // check if our overlay exists already
        if (!getOverlayDiv()) {
            createOverlay();
            setUpInputEventListener();
            setTimeout(() => focusInput(), 100);
            await setUpOverlayEventListener();
        } else {
            focusInput();
        }
        sendResponse([]);
        return true
    }
);

async function setUpOverlayEventListener() {
    const overlayDiv = getOverlayDiv();
    overlayDiv.addEventListener('keydown', async function(documentEvent) {
        if (getSearchInputElement()) {
            focusInput();
            const focusedElement = getFocusedListElement();
            switch(documentEvent.key) {
                case "Up":
                case "ArrowUp":
                    if (focusedElement.getAttribute('class') === 'skater-link skater-result-0 skater-focused') {
                        focusInput();
                    } else if (focusedElement.isSameNode(getSearchInputElement())) {
                        // do nothing
                    } else {
                        // move to previous result
                        moveUpOneResult();
                        documentEvent.preventDefault();
                    }
                    return true
                case "Down":
                case "ArrowDown":
                    // move to next search result
                    moveDownOneResult();
                    return true
                case "Enter":
                    // go to first inputEvent in the list
                    const selectedResult = getFocusedListElement();
                    if (documentEvent.ctrlKey){
                        // open in same window
                    } else {
                        destroyOverlay();                   
                        await goTo(selectedResult.href);
                    }
                case "Escape":
                    destroyOverlay();
            }
        }
        return true
    });
}

function setUpInputEventListener() {
    const searchInput = getSearchInputElement();
    searchInput.addEventListener('keyup', async function(inputEvent) {
        const query = searchInput.value;
        const bookmarkSearchResults = await sendBackgroundMessage({userSearch: query});
        // refine results
        if (Array.isArray(bookmarkSearchResults) && isValidInputEvent(inputEvent.key)) {
            const refinedResults = refineResults(bookmarkSearchResults, query);
            refreshActiveSearchResults(refinedResults);
            if (refinedResults.length) {
                if (!document.querySelector('.skater-focused')) {
                    setTimeout(() => animateFocusedSearchResult(0), 100);
                    giveElementFocusedClass(0);
                }
            }
        }
        return true
    });
}

async function goTo(url) {
    // checks if a tab with this url already exists
    // if so, go to it, else open a new window
    await sendBackgroundMessage({url: url});
}


function stripIndexFromClass(element) {
    const classString = element.getAttribute('class').split(' ')[1].split('-'); 
    return parseInt(classString[classString.length - 1]);
}

function moveUpOneResult() {
    if (getFocusedListElement().getAttribute('class') === 'skater-link skater-result-0 skater-focused') {
        focusInput();
    } else if (getFocusedListElement().isSameNode(getSearchInputElement())) {
        // do nothing
    } else {
        const indexOfLastFocus = stripIndexFromClass(getFocusedListElement());
        const index = indexOfLastFocus - 1;
        updateSearchResultsCSS(index);
        focusInput();
    }
}

function moveDownOneResult() {
    let index;
    const indexOfLastFocus = stripIndexFromClass(getFocusedListElement());
    index = indexOfLastFocus + 1;
    // handle if you are already focused on the last list item
    if (document.querySelector(`.skater-result-${index}`)) {
        updateSearchResultsCSS(index);
    }
    focusInput();
}

function animateFocusedSearchResult(index) {
    const focusedElement = document.querySelector(`.skater-result-${index}`);
    if (focusedElement) {
        focusedElement.parentElement.style['background-position-y'] = '100%';
        focusedElement.style.color = 'black';
        focusedElement.style.outline = "none";
    }
}

function updateSearchResultsCSS(index) {
    const searchElements = getSearchResultsElementChildren();
    searchElements.forEach(e => {
        resetListElementCSS(e.parentElement, index);
        resetListElementClass(e);
    });
    // color focused element
    giveElementFocusedClass(index);
    animateFocusedSearchResult(index);
}

function resetListElementClass(skaterLinkElement) {
    const elementRootClass = stripFocusFromClass(skaterLinkElement.getAttribute('class')); 
    skaterLinkElement.setAttribute('class', elementRootClass);
}

function stripFocusFromClass(classString) {
    const rootClassList = classString.split(' ');
    if (classString.length > 2) {
        return rootClassList.slice(0, 2).join(' ');
    } else {
        return classString
    }
}

function giveElementFocusedClass(index) {
    const focusedElement = document.querySelector(`.skater-result-${index}`);
    focusedElement.setAttribute('class', `skater-link skater-result-${index} skater-focused`);
}

function getFocusedListElement() {
    return document.querySelector('.skater-focused');
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
    if (overlayDiv) {
        overlayDiv.parentNode.removeChild(overlayDiv);
    }
}

function createOverlayDiv () {
    const overlayDiv = document.createElement('div');
    overlayDiv.style = "position: fixed; left: 0; top: 0; width: 100%; height: 100%; background: rgba(204, 204, 204, 0.3); z-index:2147483647;";
    overlayDiv.id = "skater-overlay"
    return overlayDiv
}

function createSearchIcon() {
    const searchIcon = document.createElement('img');
    searchIcon.setAttribute('class', "search-icon");
    searchIcon.src = "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDU2Ljk2NiA1Ni45NjYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDU2Ljk2NiA1Ni45NjY7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4Ij4KPHBhdGggZD0iTTU1LjE0Niw1MS44ODdMNDEuNTg4LDM3Ljc4NmMzLjQ4Ni00LjE0NCw1LjM5Ni05LjM1OCw1LjM5Ni0xNC43ODZjMC0xMi42ODItMTAuMzE4LTIzLTIzLTIzcy0yMywxMC4zMTgtMjMsMjMgIHMxMC4zMTgsMjMsMjMsMjNjNC43NjEsMCw5LjI5OC0xLjQzNiwxMy4xNzctNC4xNjJsMTMuNjYxLDE0LjIwOGMwLjU3MSwwLjU5MywxLjMzOSwwLjkyLDIuMTYyLDAuOTIgIGMwLjc3OSwwLDEuNTE4LTAuMjk3LDIuMDc5LTAuODM3QzU2LjI1NSw1NC45ODIsNTYuMjkzLDUzLjA4LDU1LjE0Niw1MS44ODd6IE0yMy45ODQsNmM5LjM3NCwwLDE3LDcuNjI2LDE3LDE3cy03LjYyNiwxNy0xNywxNyAgcy0xNy03LjYyNi0xNy0xN1MxNC42MSw2LDIzLjk4NCw2eiIgZmlsbD0iIzAwMDAwMCIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K"
    searchIcon.style = "position: absolute; margin-top: 23px; left: 10px; width: 20px; opacity: 50%"
    return searchIcon
}


function createSearchInput() {
    const searchInput = document.createElement('input');
    searchInput.id = "searchInput";
    searchInput.setAttribute('class', "");
    searchInput.style = "height: 60px; width: 80%; padding: 2px 23px 2px 35px; background-color: #f5f5f5; font-size:19px; font-family: Helvetica Neue,Helvetica,Arial,sans-serif;"
    searchInput.style.border = "0px";
    searchInput.style.outline = "none";
    searchInput.style['border-width'] = "0px";
    searchInput.autocomplete = "off";
    searchInput.placeholder="Skate to...";
    return searchInput
}

function createSearchWrapperDiv() {
    const searchWrapperDiv = document.createElement('div');
    searchWrapperDiv.id = "searchWrapperDiv";
    searchWrapperDiv.style = "width:400px; margin:auto; position: absolute; top: 50%; left: 40%; margin-right: -50%; transform: translate(-50%, -%50);"
    searchWrapperDiv.style.padding = "5px";
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

function resetListElementCSS(listElement, index) {
    listElement.setAttribute('class', 'unselected');
    listElement.style['background-position-y'] = "-0%";
    listElement.style['background-image'] = 'linear-gradient(#f5f5f5 50%, #c6f6d5 50%)';
    listElement.style['transition'] = 'background 200ms ease';
    listElement.style['background-size'] = 'auto 200%';
    listElement.style['border-radius'] = '10px';
    listElement.style.padding = '4px 0px 4px 0px';
}

function createListItem(result, index) {
    const listElement = document.createElement('div');
    const listURL = document.createElement('a');
    const listIMG = document.createElement('img');

    const matches = result.url.match(/^https?\:\/\/(?:www\.)?([^\/?#]+)(?:[\/?#]|$)/i);
    const domain = matches && matches[1] // domain is null if no matches found

    listIMG.src = `https://www.google.com/s2/favicons?domain_url=${domain}`;
    listIMG.style.padding = '0% 5% 0% 5%';
    listIMG.style['margin-bottom'] = '-1%';
    listIMG.style.display = 'inline';
    listIMG.setAttribute('class', 'domain-icon');

    listURL.setAttribute('class', `skater-link skater-result-${index}`);
    listURL.style.color = "black";
    listURL.style['text-decoration'] = 'none';

    listElement.setAttribute('class', `searchResultItem`);
    resetListElementCSS(listElement, index);

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
      const queryLower = query.toLowerCase();
      const bookmarkTitle = result.title.toLowerCase();
      return (bookmarkTitle.includes(queryLower) || result.url.includes(queryLower)) && result.hasOwnProperty('url');
    });
}

function refreshActiveSearchResults(results) {
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

function sendBackgroundMessage(query_object) {
    if ((query_object.url && query_object.url.length > 0) || (query_object.userSearch && query_object.userSearch.length)) {
        return new Promise((resolve, _reject) => {
            chrome.runtime.sendMessage(query_object, resolve);
        });
    } else {
        return Promise.resolve([]);
    }
}

module.exports = {
    isValidInputEvent
}