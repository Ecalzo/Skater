
function getSearchInputElement() {
  return document.getElementById("searchInput");
}

function getSearchResultsElement() {
  return document.getElementById("searchResults");
}

document.addEventListener('DOMContentLoaded', function() {
  focusInput();
  const browser = chrome || browser;
  const searchInput = getSearchInputElement();
  searchInput.addEventListener('keyup', async function(event) {
    const query = searchInput.value;
    const bookmarkSearchResults = await searchBookmarks(query);
    // refine results
    const refinedResults = refineResults(bookmarkSearchResults, query);
    updateSearchText(refinedResults);
    if (event.key === "Enter") {
      // go to first event in the list
      const top_result = refinedResults[0];
      browser.tabs.create({url: top_result.url, active: true});
      window.close();
    }
  });
}, false);


function refineResults(bookmarkSearchResults, query) {
  return bookmarkSearchResults.filter(result => {
    // cuts bookmark Title down to a substring for closer matching
    const queryLen = query.length;
    const queryLower = query.toLowerCase();
    const bookmarkTitle = result.title.substring(0, queryLen).toLowerCase();
    return bookmarkTitle.includes(queryLower) && (typeof result.url != 'undefined');
  });
}


function updateLinkEventListeners() {
  const browser = chrome || browser;
  const links = document.querySelectorAll(".link");
  if (links.length) {
    links.forEach(link => {
      link.addEventListener('click', event => {
        const ctrlPressed = (event.ctrlKey || event.metaKey);
        const url = event.target.href;
        browser.tabs.create({url: url, active: !ctrlPressed});
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
  if (result.title.length > 27) {
    element.querySelector('.link').innerHTML = result.title.substring(0, 27) + '...';
  }
  else {
    element.querySelector('.link').innerHTML = result.title;
  }
  element.querySelector('.link').href = result.url;
  return element;
}

function focusInput() {
  getSearchInputElement().focus();
}

function searchBookmarks(query) {
  const browser = chrome || browser;
  if (query.length) {
    return new Promise((resolve, _reject) => {
      browser.bookmarks.search(query, resolve);
    });
  } else {
    return Promise.resolve([]);
  }
}
