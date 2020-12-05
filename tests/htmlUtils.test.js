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

test('Asserts that the desired list element is created', () => {
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

test('Asserts that a list elements CSS is properly reset', () => {
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

    // mess with the listElement's css
    listElement.style['background-position-y'] = "100%";
    listElement.style['transition'] = 'background 800ms ease';
    listElement.style['background-size'] = 'auto 100%';
    listElement.setAttribute('class', 'wrongClass');

    resetListElementCSS(listElement);

    expect(listElement.getAttribute('class')).toBe('searchResultItem');
    expect(listElement.style['background-position-y']).toBe('-0%');
    expect(listElement.style['transition']).toBe('background 200ms ease');
    expect(listElement.style['background-size']).toBe('auto 200%');
    expect(listElement.style['border-radius']).toBe('10px');
    expect(listElement.style.padding).toBe('4px 0px 4px 0px');
})

test('Asserts that createOverlayDiv successfully creates its div', () => {
    const overlayDiv = createOverlayDiv();
    document.body.appendChild(overlayDiv);
    const overlayDivSelector = document.querySelector("#skater-overlay");
    expect(overlayDiv.id).toBe("skater-overlay");
    expect(overlayDivSelector.id).toBe("skater-overlay");
})

test('Asserts that createSearchIcon successfully creates its div', () => {
    const searchIcon = createSearchIcon();
    document.body.appendChild(searchIcon);
    const searchIconSelector = document.querySelector('.search-icon');
    expect(searchIconSelector).not.toBeUndefined();
})