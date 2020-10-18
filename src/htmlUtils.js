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

function resetListElementCSS(listElement, index) {
    listElement.setAttribute('class', 'unselected');
    listElement.style['background-position-y'] = "-0%";
    listElement.style['background-image'] = 'linear-gradient(#f5f5f5 50%, #c6f6d5 50%)';
    listElement.style['transition'] = 'background 200ms ease';
    listElement.style['background-size'] = 'auto 200%';
    listElement.style['border-radius'] = '10px';
    listElement.style.padding = '4px 0px 4px 0px';
}

module.exports = {
    createOverlay,
    createOverlayDiv,
    createSearchIcon,
    createSearchInput,
    createListItem,
    resetListElementCSS
}
