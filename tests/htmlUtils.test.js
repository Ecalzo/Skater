const {
    createOverlay,
    createOverlayDiv,
    createSearchIcon,
    createSearchInput,
    createListItem,
    resetListElementCSS,
    animateFocusedSearchResult
} = require('../src/htmlUtils.js');

test('Asserts that the parent Skater overlay div is created', () => {
    createOverlay();
    expect(document.querySelector('.search-icon')).not.toBeNull()
    expect(document.querySelector('#skater-overlay')).not.toBeNull()
    expect(document.querySelector('#searchInput')).not.toBeNull()
    expect(document.querySelector('#searchResults')).not.toBeNull()
    expect(document.querySelector('#searchWrapperDiv')).not.toBeNull()
})

test('Asserts that the desired list elemet is created', () => {
    const index = 3;
    const mocked_result = {
        dateAdded: 1603287435587,
        id: "13",
        index: 6,
        parentId: "1",
        title: "TEST_youtube_this_is_super_long_bookmark_name",
        url: "https://www.youtube.com/"
    }
    const listElement = createListItem(mocked_result, index);
    document.body.appendChild(listElement);
    
    const listURL = document.querySelector('.skater-link');
    const listIMG = document.querySelector('.domain-icon');

    expect(listElement.getAttribute('class')).toBe('searchResultItem');
    expect(listURL.innerHTML).toBe("TEST_youtube_this_is_super_...");
    expect(listURL.href).toBe(mocked_result.url);
    expect(listURL.getAttribute('class')).toBe(`skater-link skater-result-${index}`);
    expect(listIMG.src).toBe("https://www.google.com/s2/favicons?domain_url=youtube.com");
})

test('Asserts that the newly focused search result has the correct properties', () => {
    const index = 3;
    const mocked_result = {
        dateAdded: 1603287435587,
        id: "13",
        index: 6,
        parentId: "1",
        title: "TEST_youtube",
        url: "https://www.youtube.com/"
    }
    const listElement = createListItem(mocked_result, index);
    document.body.appendChild(listElement);
    animateFocusedSearchResult(index);

    focusedElement = document.querySelector(`.skater-result-${index}`);
    expect(focusedElement.parentElement.style['background-position-y']).toBe('100%');
    expect(focusedElement.style.color).toBe('black');
    expect(focusedElement.style.outline).toBe('none');
})
