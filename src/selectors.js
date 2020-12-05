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
