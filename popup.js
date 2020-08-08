
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
    updateSearchText(searchResults);
    if (event.key === "Enter") {
      // go to first event in the list
      const top_result = searchResults[0];
      window.open(top_result.url)
    }
  });
}, false);


function updateSearchText(results) {
  const resultView = getSearchResultsElement();
  // wipes the unordered list
  resultView.innerHTML = '';
  results.forEach(function(result) {
    resultView.appendChild(
      createListItem(result.title)
    );
  });
}

function createListItem(title) {
  const template = document.getElementById('list-item-template');
  const element = template.content.cloneNode(true);
  element.querySelector('.name').innerHTML = title;
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
