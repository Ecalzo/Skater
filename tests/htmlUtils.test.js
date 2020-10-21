const {
    createOverlay,
    createOverlayDiv,
    createSearchIcon,
    createSearchInput,
    createListItem,
    resetListElementCSS
} = require('../src/htmlUtils.js');

test('Asserts that the parent Skater overlay div is created', () => {
    createOverlay();
    expect(document.querySelector('.search-icon')).not.toBeNull()
    expect(document.querySelector('#skater-overlay')).not.toBeNull()
    expect(document.querySelector('#searchInput')).not.toBeNull()
    expect(document.querySelector('#searchResults')).not.toBeNull()
    expect(document.querySelector('#searchWrapperDiv')).not.toBeNull()
})
