(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const {
    isValidInputEvent,
    stripIndexFromClass,
    stripFocusFromClass,
    giveElementFocusedClass,
    refineResults
} = require('./src/utils.js');

const {
    createOverlay,
    createListItem,
    resetListElementCSS,
    animateFocusedSearchResult
} = require('./src/htmlUtils.js');

const {
    getFocusedListElement,
    getSearchInputElement,
    getSearchResultsElement,
    getOverlayDiv,
    getSearchResultsElementChildren
} = require('./src/selectors');

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
    document.addEventListener('keydown', handleEscapeKey);
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
            }
        }
        return true
    });
}

function handleEscapeKey(globalEvent) {
    switch(globalEvent.key) {
        case "Escape":
            destroyOverlay();
            document.removeEventListener('keydown', handleEscapeKey);
    }
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

function destroyOverlay() {
    const overlayDiv = getOverlayDiv();
    if (overlayDiv) {
        overlayDiv.parentNode.removeChild(overlayDiv);
    }
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

},{"./src/htmlUtils.js":2,"./src/selectors":3,"./src/utils.js":4}],2:[function(require,module,exports){
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
    searchInput.id = "search-input";
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
    searchWrapperDiv.id = "search-wrapper-div";
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
    resultsDiv.id = "search-results";
    resultsDiv.style = "padding 20px; background-color: #f5f5f5; font-size:17px; font-family: Helvetica Neue,Helvetica,Arial,sans-serif;"
    resultsDiv.style.visibility = "hidden";
    resultsDiv.style.padding = "0px";
    return resultsDiv
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

function resetListElementCSS(listElement) {
    listElement.setAttribute('class', 'searchResultItem');
    listElement.style['background-position-y'] = "-0%";
    listElement.style['background-image'] = 'linear-gradient(#f5f5f5 50%, #c6f6d5 50%)';
    listElement.style['transition'] = 'background 200ms ease';
    listElement.style['background-size'] = 'auto 200%';
    listElement.style['border-radius'] = '10px';
    listElement.style.padding = '4px 0px 4px 0px';
}

function animateFocusedSearchResult(index) {
    const focusedElement = document.querySelector(`.skater-result-${index}`);
    if (focusedElement) {
        focusedElement.parentElement.style['background-position-y'] = '100%';
        focusedElement.style.color = 'black';
        focusedElement.style.outline = 'none';
    }
}

module.exports = {
    createOverlay,
    createOverlayDiv,
    createSearchIcon,
    createSearchInput,
    createListItem,
    resetListElementCSS,
    animateFocusedSearchResult
}

},{}],3:[function(require,module,exports){
function getFocusedListElement() {
    return document.querySelector('.skater-focused');
}

function getSearchInputElement() {
    return document.getElementById("search-input");
}

function getSearchResultsElement() {
    return document.getElementById("search-results");
}

function getSearchWrapperElement() {
    return document.getElementById("search-wrapper-div");
}

function getOverlayDiv() {
    return document.getElementById("skater-overlay");
}

function getSearchResultsElementChildren() {
    return document.querySelectorAll(".skater-link");
}

module.exports = {
    getFocusedListElement,
    getSearchInputElement,
    getSearchResultsElement,
    getSearchWrapperElement,
    getOverlayDiv,
    getSearchResultsElementChildren
}

},{}],4:[function(require,module,exports){
function isValidInputEvent(key) {
    const isAlphabetical = (key >= "a" && key <= "z") || (key >= "A" && key <= "Z") && key.length === 1;
    const isNumeric = (key >= "0" && key <= "9");
    const isBackspace = (key === "Backspace");
    const isEnter = (key === "Enter");
    const isShift = (key === "Shift");
    const isArrowKey = (['ArrowUp', 'Up', 'ArrowDown', 'Down', 'ArrowLeft', 'Left', 'ArrowRight', 'Right'].includes(key))
    return (isAlphabetical || isNumeric || isBackspace || isEnter || isShift) && !isArrowKey
}

function stripIndexFromClass(element) {
    const classString = element.getAttribute('class').split(' ')[1].split('-'); 
    return parseInt(classString[classString.length - 1]);
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


function refineResults(searchResults, query) {
    return searchResults.filter(result => {
      const queryLower = query.toLowerCase();
      const bookmarkTitle = result.title.toLowerCase();
      return (bookmarkTitle.includes(queryLower) || result.url.includes(queryLower)) && result.hasOwnProperty('url');
    });
}


module.exports = {
    isValidInputEvent,
    stripIndexFromClass,
    stripFocusFromClass,
    giveElementFocusedClass,
    refineResults
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2hvbWUvZWMvLm52bS92ZXJzaW9ucy9ub2RlL3YxNS4xLjAvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiY29udGVudF9zY3JpcHQuanMiLCJzcmMvaHRtbFV0aWxzLmpzIiwic3JjL3NlbGVjdG9ycy5qcyIsInNyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3Qge1xuICAgIGlzVmFsaWRJbnB1dEV2ZW50LFxuICAgIHN0cmlwSW5kZXhGcm9tQ2xhc3MsXG4gICAgc3RyaXBGb2N1c0Zyb21DbGFzcyxcbiAgICBnaXZlRWxlbWVudEZvY3VzZWRDbGFzcyxcbiAgICByZWZpbmVSZXN1bHRzXG59ID0gcmVxdWlyZSgnLi9zcmMvdXRpbHMuanMnKTtcblxuY29uc3Qge1xuICAgIGNyZWF0ZU92ZXJsYXksXG4gICAgY3JlYXRlTGlzdEl0ZW0sXG4gICAgcmVzZXRMaXN0RWxlbWVudENTUyxcbiAgICBhbmltYXRlRm9jdXNlZFNlYXJjaFJlc3VsdFxufSA9IHJlcXVpcmUoJy4vc3JjL2h0bWxVdGlscy5qcycpO1xuXG5jb25zdCB7XG4gICAgZ2V0Rm9jdXNlZExpc3RFbGVtZW50LFxuICAgIGdldFNlYXJjaElucHV0RWxlbWVudCxcbiAgICBnZXRTZWFyY2hSZXN1bHRzRWxlbWVudCxcbiAgICBnZXRPdmVybGF5RGl2LFxuICAgIGdldFNlYXJjaFJlc3VsdHNFbGVtZW50Q2hpbGRyZW5cbn0gPSByZXF1aXJlKCcuL3NyYy9zZWxlY3RvcnMnKTtcblxuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKFxuICAgIGFzeW5jIGZ1bmN0aW9uKGEsIGIsIHNlbmRSZXNwb25zZSkge1xuICAgICAgICAvLyBjaGVjayBpZiBvdXIgb3ZlcmxheSBleGlzdHMgYWxyZWFkeVxuICAgICAgICBpZiAoIWdldE92ZXJsYXlEaXYoKSkge1xuICAgICAgICAgICAgY3JlYXRlT3ZlcmxheSgpO1xuICAgICAgICAgICAgc2V0VXBJbnB1dEV2ZW50TGlzdGVuZXIoKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gZm9jdXNJbnB1dCgpLCAxMDApO1xuICAgICAgICAgICAgYXdhaXQgc2V0VXBPdmVybGF5RXZlbnRMaXN0ZW5lcigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9jdXNJbnB1dCgpO1xuICAgICAgICB9XG4gICAgICAgIHNlbmRSZXNwb25zZShbXSk7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuKTtcblxuYXN5bmMgZnVuY3Rpb24gc2V0VXBPdmVybGF5RXZlbnRMaXN0ZW5lcigpIHtcbiAgICBjb25zdCBvdmVybGF5RGl2ID0gZ2V0T3ZlcmxheURpdigpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVFc2NhcGVLZXkpO1xuICAgIG92ZXJsYXlEaXYuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGFzeW5jIGZ1bmN0aW9uKGRvY3VtZW50RXZlbnQpIHtcbiAgICAgICAgaWYgKGdldFNlYXJjaElucHV0RWxlbWVudCgpKSB7XG4gICAgICAgICAgICBmb2N1c0lucHV0KCk7XG4gICAgICAgICAgICBjb25zdCBmb2N1c2VkRWxlbWVudCA9IGdldEZvY3VzZWRMaXN0RWxlbWVudCgpO1xuICAgICAgICAgICAgc3dpdGNoKGRvY3VtZW50RXZlbnQua2V5KSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlVwXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIkFycm93VXBcIjpcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZvY3VzZWRFbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3MnKSA9PT0gJ3NrYXRlci1saW5rIHNrYXRlci1yZXN1bHQtMCBza2F0ZXItZm9jdXNlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvY3VzSW5wdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmb2N1c2VkRWxlbWVudC5pc1NhbWVOb2RlKGdldFNlYXJjaElucHV0RWxlbWVudCgpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbW92ZSB0byBwcmV2aW91cyByZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVVcE9uZVJlc3VsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnRFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgY2FzZSBcIkRvd25cIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwiQXJyb3dEb3duXCI6XG4gICAgICAgICAgICAgICAgICAgIC8vIG1vdmUgdG8gbmV4dCBzZWFyY2ggcmVzdWx0XG4gICAgICAgICAgICAgICAgICAgIG1vdmVEb3duT25lUmVzdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgY2FzZSBcIkVudGVyXCI6XG4gICAgICAgICAgICAgICAgICAgIC8vIGdvIHRvIGZpcnN0IGlucHV0RXZlbnQgaW4gdGhlIGxpc3RcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsZWN0ZWRSZXN1bHQgPSBnZXRGb2N1c2VkTGlzdEVsZW1lbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50RXZlbnQuY3RybEtleSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvcGVuIGluIHNhbWUgd2luZG93XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0cm95T3ZlcmxheSgpOyAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGdvVG8oc2VsZWN0ZWRSZXN1bHQuaHJlZik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVFc2NhcGVLZXkoZ2xvYmFsRXZlbnQpIHtcbiAgICBzd2l0Y2goZ2xvYmFsRXZlbnQua2V5KSB7XG4gICAgICAgIGNhc2UgXCJFc2NhcGVcIjpcbiAgICAgICAgICAgIGRlc3Ryb3lPdmVybGF5KCk7XG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlRXNjYXBlS2V5KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldFVwSW5wdXRFdmVudExpc3RlbmVyKCkge1xuICAgIGNvbnN0IHNlYXJjaElucHV0ID0gZ2V0U2VhcmNoSW5wdXRFbGVtZW50KCk7XG4gICAgc2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBhc3luYyBmdW5jdGlvbihpbnB1dEV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gc2VhcmNoSW5wdXQudmFsdWU7XG4gICAgICAgIGNvbnN0IGJvb2ttYXJrU2VhcmNoUmVzdWx0cyA9IGF3YWl0IHNlbmRCYWNrZ3JvdW5kTWVzc2FnZSh7dXNlclNlYXJjaDogcXVlcnl9KTtcbiAgICAgICAgLy8gcmVmaW5lIHJlc3VsdHNcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYm9va21hcmtTZWFyY2hSZXN1bHRzKSAmJiBpc1ZhbGlkSW5wdXRFdmVudChpbnB1dEV2ZW50LmtleSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZmluZWRSZXN1bHRzID0gcmVmaW5lUmVzdWx0cyhib29rbWFya1NlYXJjaFJlc3VsdHMsIHF1ZXJ5KTtcbiAgICAgICAgICAgIHJlZnJlc2hBY3RpdmVTZWFyY2hSZXN1bHRzKHJlZmluZWRSZXN1bHRzKTtcbiAgICAgICAgICAgIGlmIChyZWZpbmVkUmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5za2F0ZXItZm9jdXNlZCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gYW5pbWF0ZUZvY3VzZWRTZWFyY2hSZXN1bHQoMCksIDEwMCk7XG4gICAgICAgICAgICAgICAgICAgIGdpdmVFbGVtZW50Rm9jdXNlZENsYXNzKDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnb1RvKHVybCkge1xuICAgIC8vIGNoZWNrcyBpZiBhIHRhYiB3aXRoIHRoaXMgdXJsIGFscmVhZHkgZXhpc3RzXG4gICAgLy8gaWYgc28sIGdvIHRvIGl0LCBlbHNlIG9wZW4gYSBuZXcgd2luZG93XG4gICAgYXdhaXQgc2VuZEJhY2tncm91bmRNZXNzYWdlKHt1cmw6IHVybH0pO1xufVxuXG5cbmZ1bmN0aW9uIG1vdmVVcE9uZVJlc3VsdCgpIHtcbiAgICBpZiAoZ2V0Rm9jdXNlZExpc3RFbGVtZW50KCkuZ2V0QXR0cmlidXRlKCdjbGFzcycpID09PSAnc2thdGVyLWxpbmsgc2thdGVyLXJlc3VsdC0wIHNrYXRlci1mb2N1c2VkJykge1xuICAgICAgICBmb2N1c0lucHV0KCk7XG4gICAgfSBlbHNlIGlmIChnZXRGb2N1c2VkTGlzdEVsZW1lbnQoKS5pc1NhbWVOb2RlKGdldFNlYXJjaElucHV0RWxlbWVudCgpKSkge1xuICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgaW5kZXhPZkxhc3RGb2N1cyA9IHN0cmlwSW5kZXhGcm9tQ2xhc3MoZ2V0Rm9jdXNlZExpc3RFbGVtZW50KCkpO1xuICAgICAgICBjb25zdCBpbmRleCA9IGluZGV4T2ZMYXN0Rm9jdXMgLSAxO1xuICAgICAgICB1cGRhdGVTZWFyY2hSZXN1bHRzQ1NTKGluZGV4KTtcbiAgICAgICAgZm9jdXNJbnB1dCgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbW92ZURvd25PbmVSZXN1bHQoKSB7XG4gICAgbGV0IGluZGV4O1xuICAgIGNvbnN0IGluZGV4T2ZMYXN0Rm9jdXMgPSBzdHJpcEluZGV4RnJvbUNsYXNzKGdldEZvY3VzZWRMaXN0RWxlbWVudCgpKTtcbiAgICBpbmRleCA9IGluZGV4T2ZMYXN0Rm9jdXMgKyAxO1xuICAgIC8vIGhhbmRsZSBpZiB5b3UgYXJlIGFscmVhZHkgZm9jdXNlZCBvbiB0aGUgbGFzdCBsaXN0IGl0ZW1cbiAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLnNrYXRlci1yZXN1bHQtJHtpbmRleH1gKSkge1xuICAgICAgICB1cGRhdGVTZWFyY2hSZXN1bHRzQ1NTKGluZGV4KTtcbiAgICB9XG4gICAgZm9jdXNJbnB1dCgpO1xufVxuXG5cbmZ1bmN0aW9uIHVwZGF0ZVNlYXJjaFJlc3VsdHNDU1MoaW5kZXgpIHtcbiAgICBjb25zdCBzZWFyY2hFbGVtZW50cyA9IGdldFNlYXJjaFJlc3VsdHNFbGVtZW50Q2hpbGRyZW4oKTtcbiAgICBzZWFyY2hFbGVtZW50cy5mb3JFYWNoKGUgPT4ge1xuICAgICAgICByZXNldExpc3RFbGVtZW50Q1NTKGUucGFyZW50RWxlbWVudCwgaW5kZXgpO1xuICAgICAgICByZXNldExpc3RFbGVtZW50Q2xhc3MoZSk7XG4gICAgfSk7XG4gICAgLy8gY29sb3IgZm9jdXNlZCBlbGVtZW50XG4gICAgZ2l2ZUVsZW1lbnRGb2N1c2VkQ2xhc3MoaW5kZXgpO1xuICAgIGFuaW1hdGVGb2N1c2VkU2VhcmNoUmVzdWx0KGluZGV4KTtcbn1cblxuZnVuY3Rpb24gcmVzZXRMaXN0RWxlbWVudENsYXNzKHNrYXRlckxpbmtFbGVtZW50KSB7XG4gICAgY29uc3QgZWxlbWVudFJvb3RDbGFzcyA9IHN0cmlwRm9jdXNGcm9tQ2xhc3Moc2thdGVyTGlua0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpKTsgXG4gICAgc2thdGVyTGlua0VsZW1lbnQuc2V0QXR0cmlidXRlKCdjbGFzcycsIGVsZW1lbnRSb290Q2xhc3MpO1xufVxuXG5mdW5jdGlvbiBkZXN0cm95T3ZlcmxheSgpIHtcbiAgICBjb25zdCBvdmVybGF5RGl2ID0gZ2V0T3ZlcmxheURpdigpO1xuICAgIGlmIChvdmVybGF5RGl2KSB7XG4gICAgICAgIG92ZXJsYXlEaXYucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChvdmVybGF5RGl2KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGVuc3VyZVJlc3VsdHNMaXN0SXNWaXNpYmxlKCkge1xuICAgIGNvbnN0IHNlYXJjaFJlc3VsdHNFbGVtZW50ID0gZ2V0U2VhcmNoUmVzdWx0c0VsZW1lbnQoKTtcbiAgICBzZWFyY2hSZXN1bHRzRWxlbWVudC5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG4gICAgc2VhcmNoUmVzdWx0c0VsZW1lbnQuc3R5bGUucGFkZGluZyA9IFwiMTBweCAxMHB4IDEwcHggMTBweFwiO1xufVxuXG5mdW5jdGlvbiBlbnN1cmVSZXN1bHRzTGlzdElzSGlkZGVuKCkge1xuICAgIGNvbnN0IHNlYXJjaFJlc3VsdHNFbGVtZW50ID0gZ2V0U2VhcmNoUmVzdWx0c0VsZW1lbnQoKTtcbiAgICBzZWFyY2hSZXN1bHRzRWxlbWVudC5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICBzZWFyY2hSZXN1bHRzRWxlbWVudC5zdHlsZS5wYWRkaW5nID0gXCIwcHhcIjtcbn1cblxuZnVuY3Rpb24gcmVmcmVzaEFjdGl2ZVNlYXJjaFJlc3VsdHMocmVzdWx0cykge1xuICAgIGNvbnN0IHJlc3VsdHNEaXYgPSBnZXRTZWFyY2hSZXN1bHRzRWxlbWVudCgpO1xuICAgIC8vIHdpcGVzIHRoZSB1bm9yZGVyZWQgbGlzdFxuICAgIHJlc3VsdHNEaXYuaW5uZXJIVE1MID0gJyc7XG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoKSB7XG4gICAgICAgIGVuc3VyZVJlc3VsdHNMaXN0SXNWaXNpYmxlKCk7XG4gICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgIHJlc3VsdHMuZm9yRWFjaChyZXN1bHQgPT4ge1xuICAgICAgICAgICAgcmVzdWx0c0Rpdi5hcHBlbmRDaGlsZChjcmVhdGVMaXN0SXRlbShyZXN1bHQsIGluZGV4KSk7XG4gICAgICAgICAgICBpbmRleCArPSAxO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBlbnN1cmVSZXN1bHRzTGlzdElzSGlkZGVuKCk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gZm9jdXNJbnB1dCgpIHtcbiAgICBnZXRTZWFyY2hJbnB1dEVsZW1lbnQoKS5mb2N1cygpO1xufVxuXG5mdW5jdGlvbiBzZW5kQmFja2dyb3VuZE1lc3NhZ2UocXVlcnlfb2JqZWN0KSB7XG4gICAgaWYgKChxdWVyeV9vYmplY3QudXJsICYmIHF1ZXJ5X29iamVjdC51cmwubGVuZ3RoID4gMCkgfHwgKHF1ZXJ5X29iamVjdC51c2VyU2VhcmNoICYmIHF1ZXJ5X29iamVjdC51c2VyU2VhcmNoLmxlbmd0aCkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCBfcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShxdWVyeV9vYmplY3QsIHJlc29sdmUpO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICB9XG59XG4iLCJmdW5jdGlvbiBjcmVhdGVPdmVybGF5KCkge1xuICAgIGNvbnN0IHNlYXJjaEljb24gPSBjcmVhdGVTZWFyY2hJY29uKCk7XG4gICAgY29uc3Qgb3ZlcmxheURpdiA9IGNyZWF0ZU92ZXJsYXlEaXYoKTtcbiAgICBjb25zdCBzZWFyY2hJbnB1dCA9IGNyZWF0ZVNlYXJjaElucHV0KCk7XG4gICAgY29uc3QgcmVzdWx0c0RpdiA9IGNyZWF0ZVNlYXJjaFJlc3VsdHNMaXN0KCk7XG4gICAgY29uc3Qgc2VhcmNoV3JhcHBlckRpdj0gY3JlYXRlU2VhcmNoV3JhcHBlckRpdigpO1xuXG4gICAgc2VhcmNoV3JhcHBlckRpdi5hcHBlbmRDaGlsZChzZWFyY2hJY29uKTtcbiAgICBzZWFyY2hXcmFwcGVyRGl2LmFwcGVuZENoaWxkKHNlYXJjaElucHV0KTtcbiAgICBzZWFyY2hXcmFwcGVyRGl2LmFwcGVuZENoaWxkKHJlc3VsdHNEaXYpO1xuICAgIG92ZXJsYXlEaXYuYXBwZW5kQ2hpbGQoc2VhcmNoV3JhcHBlckRpdik7XG4gICAgLy8gYXBwZW5kIGFsbCB0byBkb2N1bWVudFxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3ZlcmxheURpdik7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU92ZXJsYXlEaXYgKCkge1xuICAgIGNvbnN0IG92ZXJsYXlEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBvdmVybGF5RGl2LnN0eWxlID0gXCJwb3NpdGlvbjogZml4ZWQ7IGxlZnQ6IDA7IHRvcDogMDsgd2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgYmFja2dyb3VuZDogcmdiYSgyMDQsIDIwNCwgMjA0LCAwLjMpOyB6LWluZGV4OjIxNDc0ODM2NDc7XCI7XG4gICAgb3ZlcmxheURpdi5pZCA9IFwic2thdGVyLW92ZXJsYXlcIlxuICAgIHJldHVybiBvdmVybGF5RGl2XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNlYXJjaEljb24oKSB7XG4gICAgY29uc3Qgc2VhcmNoSWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgIHNlYXJjaEljb24uc2V0QXR0cmlidXRlKCdjbGFzcycsIFwic2VhcmNoLWljb25cIik7XG4gICAgc2VhcmNoSWNvbi5zcmMgPSBcImRhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4O2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpYVhOdkxUZzROVGt0TVNJL1BnbzhJUzB0SUVkbGJtVnlZWFJ2Y2pvZ1FXUnZZbVVnU1d4c2RYTjBjbUYwYjNJZ01Ua3VNQzR3TENCVFZrY2dSWGh3YjNKMElGQnNkV2N0U1c0Z0xpQlRWa2NnVm1WeWMybHZiam9nTmk0d01DQkNkV2xzWkNBd0tTQWdMUzArQ2p4emRtY2dlRzFzYm5NOUltaDBkSEE2THk5M2QzY3Vkek11YjNKbkx6SXdNREF2YzNabklpQjRiV3h1Y3pwNGJHbHVhejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOTRiR2x1YXlJZ2RtVnljMmx2YmowaU1TNHhJaUJwWkQwaVEyRndZVjh4SWlCNFBTSXdjSGdpSUhrOUlqQndlQ0lnZG1sbGQwSnZlRDBpTUNBd0lEVTJMamsyTmlBMU5pNDVOallpSUhOMGVXeGxQU0psYm1GaWJHVXRZbUZqYTJkeWIzVnVaRHB1WlhjZ01DQXdJRFUyTGprMk5pQTFOaTQ1TmpZN0lpQjRiV3c2YzNCaFkyVTlJbkJ5WlhObGNuWmxJaUIzYVdSMGFEMGlNVFp3ZUNJZ2FHVnBaMmgwUFNJeE5uQjRJajRLUEhCaGRHZ2daRDBpVFRVMUxqRTBOaXcxTVM0NE9EZE1OREV1TlRnNExETTNMamM0Tm1NekxqUTROaTAwTGpFME5DdzFMak01TmkwNUxqTTFPQ3cxTGpNNU5pMHhOQzQzT0Raak1DMHhNaTQyT0RJdE1UQXVNekU0TFRJekxUSXpMVEl6Y3kweU15d3hNQzR6TVRndE1qTXNNak1nSUhNeE1DNHpNVGdzTWpNc01qTXNNak5qTkM0M05qRXNNQ3c1TGpJNU9DMHhMalF6Tml3eE15NHhOemN0TkM0eE5qSnNNVE11TmpZeExERTBMakl3T0dNd0xqVTNNU3d3TGpVNU15d3hMak16T1N3d0xqa3lMREl1TVRZeUxEQXVPVElnSUdNd0xqYzNPU3d3TERFdU5URTRMVEF1TWprM0xESXVNRGM1TFRBdU9ETTNRelUyTGpJMU5TdzFOQzQ1T0RJc05UWXVNamt6TERVekxqQTRMRFUxTGpFME5pdzFNUzQ0T0RkNklFMHlNeTQ1T0RRc05tTTVMak0zTkN3d0xERTNMRGN1TmpJMkxERTNMREUzY3kwM0xqWXlOaXd4TnkweE55d3hOeUFnY3kweE55MDNMall5TmkweE55MHhOMU14TkM0Mk1TdzJMREl6TGprNE5DdzJlaUlnWm1sc2JEMGlJekF3TURBd01DSXZQZ284Wno0S1BDOW5QZ284Wno0S1BDOW5QZ284Wno0S1BDOW5QZ284Wno0S1BDOW5QZ284Wno0S1BDOW5QZ284Wno0S1BDOW5QZ284Wno0S1BDOW5QZ284Wno0S1BDOW5QZ284Wno0S1BDOW5QZ284Wno0S1BDOW5QZ284Wno0S1BDOW5QZ284Wno0S1BDOW5QZ284Wno0S1BDOW5QZ284Wno0S1BDOW5QZ284Wno0S1BDOW5QZ284TDNOMlp6NEtcIlxuICAgIHNlYXJjaEljb24uc3R5bGUgPSBcInBvc2l0aW9uOiBhYnNvbHV0ZTsgbWFyZ2luLXRvcDogMjNweDsgbGVmdDogMTBweDsgd2lkdGg6IDIwcHg7IG9wYWNpdHk6IDUwJVwiXG4gICAgcmV0dXJuIHNlYXJjaEljb25cbn1cblxuZnVuY3Rpb24gY3JlYXRlU2VhcmNoSW5wdXQoKSB7XG4gICAgY29uc3Qgc2VhcmNoSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgIHNlYXJjaElucHV0LmlkID0gXCJzZWFyY2gtaW5wdXRcIjtcbiAgICBzZWFyY2hJbnB1dC5zdHlsZSA9IFwiaGVpZ2h0OiA2MHB4OyB3aWR0aDogODAlOyBwYWRkaW5nOiAycHggMjNweCAycHggMzVweDsgYmFja2dyb3VuZC1jb2xvcjogI2Y1ZjVmNTsgZm9udC1zaXplOjE5cHg7IGZvbnQtZmFtaWx5OiBIZWx2ZXRpY2EgTmV1ZSxIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZjtcIlxuICAgIHNlYXJjaElucHV0LnN0eWxlLmJvcmRlciA9IFwiMHB4XCI7XG4gICAgc2VhcmNoSW5wdXQuc3R5bGUub3V0bGluZSA9IFwibm9uZVwiO1xuICAgIHNlYXJjaElucHV0LnN0eWxlWydib3JkZXItd2lkdGgnXSA9IFwiMHB4XCI7XG4gICAgc2VhcmNoSW5wdXQuYXV0b2NvbXBsZXRlID0gXCJvZmZcIjtcbiAgICBzZWFyY2hJbnB1dC5wbGFjZWhvbGRlcj1cIlNrYXRlIHRvLi4uXCI7XG4gICAgcmV0dXJuIHNlYXJjaElucHV0XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNlYXJjaFdyYXBwZXJEaXYoKSB7XG4gICAgY29uc3Qgc2VhcmNoV3JhcHBlckRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHNlYXJjaFdyYXBwZXJEaXYuaWQgPSBcInNlYXJjaC13cmFwcGVyLWRpdlwiO1xuICAgIHNlYXJjaFdyYXBwZXJEaXYuc3R5bGUgPSBcIndpZHRoOjQwMHB4OyBtYXJnaW46YXV0bzsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDUwJTsgbGVmdDogNDAlOyBtYXJnaW4tcmlnaHQ6IC01MCU7IHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC0lNTApO1wiXG4gICAgc2VhcmNoV3JhcHBlckRpdi5zdHlsZS5wYWRkaW5nID0gXCI1cHhcIjtcbiAgICBzZWFyY2hXcmFwcGVyRGl2LnN0eWxlLmJvcmRlciA9IFwiMXB4IHNvbGlkIGdyZXlcIjtcbiAgICBzZWFyY2hXcmFwcGVyRGl2LnN0eWxlWydib3JkZXItcmFkaXVzJ10gPSBcIjhweFwiO1xuICAgIHNlYXJjaFdyYXBwZXJEaXYuc3R5bGVbJ2JhY2tncm91bmQtY29sb3InXSA9IFwiI2Y1ZjVmNVwiO1xuICAgIHNlYXJjaFdyYXBwZXJEaXYuc3R5bGVbJ2JveC1zaGFkb3cnXSA9IFwiLTEzcHggMTNweCAxNnB4IDFweCByZ2JhKDAsIDAsIDAsIDAuMilcIlxuICAgIHJldHVybiBzZWFyY2hXcmFwcGVyRGl2XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNlYXJjaFJlc3VsdHNMaXN0KCkge1xuICAgIGNvbnN0IHJlc3VsdHNEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICByZXN1bHRzRGl2LmlkID0gXCJzZWFyY2gtcmVzdWx0c1wiO1xuICAgIHJlc3VsdHNEaXYuc3R5bGUgPSBcInBhZGRpbmcgMjBweDsgYmFja2dyb3VuZC1jb2xvcjogI2Y1ZjVmNTsgZm9udC1zaXplOjE3cHg7IGZvbnQtZmFtaWx5OiBIZWx2ZXRpY2EgTmV1ZSxIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZjtcIlxuICAgIHJlc3VsdHNEaXYuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgcmVzdWx0c0Rpdi5zdHlsZS5wYWRkaW5nID0gXCIwcHhcIjtcbiAgICByZXR1cm4gcmVzdWx0c0RpdlxufVxuXG5mdW5jdGlvbiBjcmVhdGVMaXN0SXRlbShyZXN1bHQsIGluZGV4KSB7XG4gICAgY29uc3QgbGlzdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb25zdCBsaXN0VVJMID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIGNvbnN0IGxpc3RJTUcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcblxuICAgIGNvbnN0IG1hdGNoZXMgPSByZXN1bHQudXJsLm1hdGNoKC9eaHR0cHM/XFw6XFwvXFwvKD86d3d3XFwuKT8oW15cXC8/I10rKSg/OltcXC8/I118JCkvaSk7XG4gICAgY29uc3QgZG9tYWluID0gbWF0Y2hlcyAmJiBtYXRjaGVzWzFdIC8vIGRvbWFpbiBpcyBudWxsIGlmIG5vIG1hdGNoZXMgZm91bmRcblxuICAgIGxpc3RJTUcuc3JjID0gYGh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vczIvZmF2aWNvbnM/ZG9tYWluX3VybD0ke2RvbWFpbn1gO1xuICAgIGxpc3RJTUcuc3R5bGUucGFkZGluZyA9ICcwJSA1JSAwJSA1JSc7XG4gICAgbGlzdElNRy5zdHlsZVsnbWFyZ2luLWJvdHRvbSddID0gJy0xJSc7XG4gICAgbGlzdElNRy5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZSc7XG4gICAgbGlzdElNRy5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2RvbWFpbi1pY29uJyk7XG5cbiAgICBsaXN0VVJMLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBgc2thdGVyLWxpbmsgc2thdGVyLXJlc3VsdC0ke2luZGV4fWApO1xuICAgIGxpc3RVUkwuc3R5bGUuY29sb3IgPSBcImJsYWNrXCI7XG4gICAgbGlzdFVSTC5zdHlsZVsndGV4dC1kZWNvcmF0aW9uJ10gPSAnbm9uZSc7XG5cbiAgICByZXNldExpc3RFbGVtZW50Q1NTKGxpc3RFbGVtZW50KTtcblxuICAgIGlmIChyZXN1bHQudGl0bGUubGVuZ3RoID4gMjcpIHtcbiAgICAgICAgbGlzdFVSTC5pbm5lckhUTUwgPSByZXN1bHQudGl0bGUuc3Vic3RyaW5nKDAsIDI3KSArICcuLi4nO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbGlzdFVSTC5pbm5lckhUTUwgPSByZXN1bHQudGl0bGU7XG4gICAgfVxuICAgIGxpc3RVUkwuaHJlZiA9IHJlc3VsdC51cmw7XG4gICAgbGlzdEVsZW1lbnQuYXBwZW5kQ2hpbGQobGlzdElNRyk7XG4gICAgbGlzdEVsZW1lbnQuYXBwZW5kQ2hpbGQobGlzdFVSTCk7XG4gICAgcmV0dXJuIGxpc3RFbGVtZW50XG59XG5cbmZ1bmN0aW9uIHJlc2V0TGlzdEVsZW1lbnRDU1MobGlzdEVsZW1lbnQpIHtcbiAgICBsaXN0RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ3NlYXJjaFJlc3VsdEl0ZW0nKTtcbiAgICBsaXN0RWxlbWVudC5zdHlsZVsnYmFja2dyb3VuZC1wb3NpdGlvbi15J10gPSBcIi0wJVwiO1xuICAgIGxpc3RFbGVtZW50LnN0eWxlWydiYWNrZ3JvdW5kLWltYWdlJ10gPSAnbGluZWFyLWdyYWRpZW50KCNmNWY1ZjUgNTAlLCAjYzZmNmQ1IDUwJSknO1xuICAgIGxpc3RFbGVtZW50LnN0eWxlWyd0cmFuc2l0aW9uJ10gPSAnYmFja2dyb3VuZCAyMDBtcyBlYXNlJztcbiAgICBsaXN0RWxlbWVudC5zdHlsZVsnYmFja2dyb3VuZC1zaXplJ10gPSAnYXV0byAyMDAlJztcbiAgICBsaXN0RWxlbWVudC5zdHlsZVsnYm9yZGVyLXJhZGl1cyddID0gJzEwcHgnO1xuICAgIGxpc3RFbGVtZW50LnN0eWxlLnBhZGRpbmcgPSAnNHB4IDBweCA0cHggMHB4Jztcbn1cblxuZnVuY3Rpb24gYW5pbWF0ZUZvY3VzZWRTZWFyY2hSZXN1bHQoaW5kZXgpIHtcbiAgICBjb25zdCBmb2N1c2VkRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5za2F0ZXItcmVzdWx0LSR7aW5kZXh9YCk7XG4gICAgaWYgKGZvY3VzZWRFbGVtZW50KSB7XG4gICAgICAgIGZvY3VzZWRFbGVtZW50LnBhcmVudEVsZW1lbnQuc3R5bGVbJ2JhY2tncm91bmQtcG9zaXRpb24teSddID0gJzEwMCUnO1xuICAgICAgICBmb2N1c2VkRWxlbWVudC5zdHlsZS5jb2xvciA9ICdibGFjayc7XG4gICAgICAgIGZvY3VzZWRFbGVtZW50LnN0eWxlLm91dGxpbmUgPSAnbm9uZSc7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVPdmVybGF5LFxuICAgIGNyZWF0ZU92ZXJsYXlEaXYsXG4gICAgY3JlYXRlU2VhcmNoSWNvbixcbiAgICBjcmVhdGVTZWFyY2hJbnB1dCxcbiAgICBjcmVhdGVMaXN0SXRlbSxcbiAgICByZXNldExpc3RFbGVtZW50Q1NTLFxuICAgIGFuaW1hdGVGb2N1c2VkU2VhcmNoUmVzdWx0XG59XG4iLCJmdW5jdGlvbiBnZXRGb2N1c2VkTGlzdEVsZW1lbnQoKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5za2F0ZXItZm9jdXNlZCcpO1xufVxuXG5mdW5jdGlvbiBnZXRTZWFyY2hJbnB1dEVsZW1lbnQoKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2VhcmNoLWlucHV0XCIpO1xufVxuXG5mdW5jdGlvbiBnZXRTZWFyY2hSZXN1bHRzRWxlbWVudCgpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWFyY2gtcmVzdWx0c1wiKTtcbn1cblxuZnVuY3Rpb24gZ2V0U2VhcmNoV3JhcHBlckVsZW1lbnQoKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2VhcmNoLXdyYXBwZXItZGl2XCIpO1xufVxuXG5mdW5jdGlvbiBnZXRPdmVybGF5RGl2KCkge1xuICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNrYXRlci1vdmVybGF5XCIpO1xufVxuXG5mdW5jdGlvbiBnZXRTZWFyY2hSZXN1bHRzRWxlbWVudENoaWxkcmVuKCkge1xuICAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLnNrYXRlci1saW5rXCIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRGb2N1c2VkTGlzdEVsZW1lbnQsXG4gICAgZ2V0U2VhcmNoSW5wdXRFbGVtZW50LFxuICAgIGdldFNlYXJjaFJlc3VsdHNFbGVtZW50LFxuICAgIGdldFNlYXJjaFdyYXBwZXJFbGVtZW50LFxuICAgIGdldE92ZXJsYXlEaXYsXG4gICAgZ2V0U2VhcmNoUmVzdWx0c0VsZW1lbnRDaGlsZHJlblxufVxuIiwiZnVuY3Rpb24gaXNWYWxpZElucHV0RXZlbnQoa2V5KSB7XG4gICAgY29uc3QgaXNBbHBoYWJldGljYWwgPSAoa2V5ID49IFwiYVwiICYmIGtleSA8PSBcInpcIikgfHwgKGtleSA+PSBcIkFcIiAmJiBrZXkgPD0gXCJaXCIpICYmIGtleS5sZW5ndGggPT09IDE7XG4gICAgY29uc3QgaXNOdW1lcmljID0gKGtleSA+PSBcIjBcIiAmJiBrZXkgPD0gXCI5XCIpO1xuICAgIGNvbnN0IGlzQmFja3NwYWNlID0gKGtleSA9PT0gXCJCYWNrc3BhY2VcIik7XG4gICAgY29uc3QgaXNFbnRlciA9IChrZXkgPT09IFwiRW50ZXJcIik7XG4gICAgY29uc3QgaXNTaGlmdCA9IChrZXkgPT09IFwiU2hpZnRcIik7XG4gICAgY29uc3QgaXNBcnJvd0tleSA9IChbJ0Fycm93VXAnLCAnVXAnLCAnQXJyb3dEb3duJywgJ0Rvd24nLCAnQXJyb3dMZWZ0JywgJ0xlZnQnLCAnQXJyb3dSaWdodCcsICdSaWdodCddLmluY2x1ZGVzKGtleSkpXG4gICAgcmV0dXJuIChpc0FscGhhYmV0aWNhbCB8fCBpc051bWVyaWMgfHwgaXNCYWNrc3BhY2UgfHwgaXNFbnRlciB8fCBpc1NoaWZ0KSAmJiAhaXNBcnJvd0tleVxufVxuXG5mdW5jdGlvbiBzdHJpcEluZGV4RnJvbUNsYXNzKGVsZW1lbnQpIHtcbiAgICBjb25zdCBjbGFzc1N0cmluZyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpLnNwbGl0KCcgJylbMV0uc3BsaXQoJy0nKTsgXG4gICAgcmV0dXJuIHBhcnNlSW50KGNsYXNzU3RyaW5nW2NsYXNzU3RyaW5nLmxlbmd0aCAtIDFdKTtcbn1cblxuZnVuY3Rpb24gc3RyaXBGb2N1c0Zyb21DbGFzcyhjbGFzc1N0cmluZykge1xuICAgIGNvbnN0IHJvb3RDbGFzc0xpc3QgPSBjbGFzc1N0cmluZy5zcGxpdCgnICcpO1xuICAgIGlmIChjbGFzc1N0cmluZy5sZW5ndGggPiAyKSB7XG4gICAgICAgIHJldHVybiByb290Q2xhc3NMaXN0LnNsaWNlKDAsIDIpLmpvaW4oJyAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY2xhc3NTdHJpbmdcbiAgICB9XG59XG5cblxuZnVuY3Rpb24gZ2l2ZUVsZW1lbnRGb2N1c2VkQ2xhc3MoaW5kZXgpIHtcbiAgICBjb25zdCBmb2N1c2VkRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5za2F0ZXItcmVzdWx0LSR7aW5kZXh9YCk7XG4gICAgZm9jdXNlZEVsZW1lbnQuc2V0QXR0cmlidXRlKCdjbGFzcycsIGBza2F0ZXItbGluayBza2F0ZXItcmVzdWx0LSR7aW5kZXh9IHNrYXRlci1mb2N1c2VkYCk7XG59XG5cblxuZnVuY3Rpb24gcmVmaW5lUmVzdWx0cyhzZWFyY2hSZXN1bHRzLCBxdWVyeSkge1xuICAgIHJldHVybiBzZWFyY2hSZXN1bHRzLmZpbHRlcihyZXN1bHQgPT4ge1xuICAgICAgY29uc3QgcXVlcnlMb3dlciA9IHF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgICBjb25zdCBib29rbWFya1RpdGxlID0gcmVzdWx0LnRpdGxlLnRvTG93ZXJDYXNlKCk7XG4gICAgICByZXR1cm4gKGJvb2ttYXJrVGl0bGUuaW5jbHVkZXMocXVlcnlMb3dlcikgfHwgcmVzdWx0LnVybC5pbmNsdWRlcyhxdWVyeUxvd2VyKSkgJiYgcmVzdWx0Lmhhc093blByb3BlcnR5KCd1cmwnKTtcbiAgICB9KTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpc1ZhbGlkSW5wdXRFdmVudCxcbiAgICBzdHJpcEluZGV4RnJvbUNsYXNzLFxuICAgIHN0cmlwRm9jdXNGcm9tQ2xhc3MsXG4gICAgZ2l2ZUVsZW1lbnRGb2N1c2VkQ2xhc3MsXG4gICAgcmVmaW5lUmVzdWx0c1xufVxuIl19
