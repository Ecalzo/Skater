
document.addEventListener('keydown', event => {
    if (event.ctrlKey && event.key === 'l') {
        const overlayDiv = createOverlayDiv();
        const searchDiv = createSearchDiv();

        overlayDiv.appendChild(searchDiv);
        document.body.appendChild(overlayDiv);

        getSearchInputElement().focus();
    }
});

function getSearchInputElement() {
    return document.getElementById("searchInput");
  }

function createOverlayDiv () {
    const overlayDiv = document.createElement('div');
    overlayDiv.style = "position: fixed; left: 0; top: 0; width: 100%; height: 100%; opacity: 50%; background-color: gray;";
    overlayDiv.id = "evans-div"
    return overlayDiv
}

function createSearchDiv() {
    const searchDiv = document.createElement('input');
    searchDiv.id = "searchInput";
    searchDiv.style = "margin:auto; position: absolute; top: 50%; left: 50%; margin-right: -50%; transform: translate(-50%, -%50);"
    searchDiv.class = "";
    searchDiv.autocomplete = "off";
    return searchDiv
}