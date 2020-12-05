const {
    isValidInputEvent,
    stripIndexFromClass,
    stripFocusFromClass,
    giveElementFocusedClass,
    refineResults,
    animateFocusedSearchResult
} = require('./src/utils.js');

const {
    createOverlay,
    createListItem,
    resetListElementCSS
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
