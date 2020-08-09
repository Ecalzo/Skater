
function getSearchInputElement() {
  return document.getElementById("searchInput")
}

function getSearchResultsElement() {
  return document.getElementById("searchResults");
}

document.addEventListener('DOMContentLoaded', function() {
  focusInput();
  const searchInput = getSearchInputElement();
  searchInput.addEventListener('keyup', async function(event) {
    const query = searchInput.value;
    const searchResults = await searchBookmarks(query);
    // refine results
    const refinedResults = refineResults(searchResults, query);
    updateSearchText(refinedResults);
    updateLinkEventListeners();
    if (event.key === "Enter") {
      // go to first event in the list
      const top_result = searchResults[0];
      window.open(top_result.url)
    }
  });
}, false);


function refineResults(searchResults, query) {
  let refinedResults = [];
  searchResults.forEach(result => {
    if (result.title.includes(query)) {
      refinedResults.push(result) 
    }
  });
  return refinedResults;
}


function updateLinkEventListeners() {
  const links = document.querySelectorAll(".link");
  if (links.length) {
    links.forEach(link => {
      link.addEventListener('click', event => {
        const ctrlPressed = (event.ctrlKey || event.metaKey);
        const url = event.target.href;
        // FIXME
        // How to keep popup.html open when ctrl + click many links
        chrome.tabs.create({'url': url, active: !ctrlPressed});
      }, false); 
    });
  }
}


function updateSearchText(results) {
  const resultView = getSearchResultsElement();
  // wipes the unordered list
  resultView.innerHTML = '';
  results.forEach(result => {
    resultView.appendChild(
      createListItem(result)
    );
  });
}

function createListItem(result) {
  const template = document.getElementById('list-item-template');
  const element = template.content.cloneNode(true);
  element.querySelector('.link').innerHTML = result.title;
  element.querySelector('.link').href = result.url;
  return element;
}

function focusInput() {
  getSearchInputElement().focus();
}

function searchBookmarks(query) {
  if (query.length) {
    return new Promise((resolve, _reject) => {
      chrome.bookmarks.search(query, resolve);
    });
  } else {
    return Promise.resolve([]);
  }
}
