const {
    isValidInputEvent,
    stripIndexFromClass,
    stripFocusFromClass,
    giveElementFocusedClass,
    refineResults
} = require('../src/utils.js');

test('Asserts that the received keypress is one of: alphabetical, numeric, backspace, enter or shift', () => {
    expect(isValidInputEvent('A')).toBe(true);
    expect(isValidInputEvent('Shift')).toBe(true);
    expect(isValidInputEvent('Backspace')).toBe(true);
    expect(isValidInputEvent('5')).toBe(true);
    expect(isValidInputEvent('z')).toBe(true);
    expect(isValidInputEvent('Up')).toBe(false);
})

test('Asserts that the class id is successfully stripped from the html class string', () => {
    const testElement = document.createElement('a');
    testElement.setAttribute('class', `skater-link skater-result-1 skater-focused`);
    expect(stripIndexFromClass(testElement)).toBe(1)
})

test('Asserts that the class skater-focused is removed from the class string', () => {
    const classString = 'skater-link skater-result-1 skater-focused';
    const expectedString = 'skater-link skater-result-1';
    expect(stripFocusFromClass(classString)).toBe(expectedString)
})

test('Asserts that the focused class with the specified index is given skater-focused class', () => {
    const testElement = document.createElement('a');
    const index = 1;
    const expectedClass = `skater-link skater-result-${index} skater-focused`
    testElement.setAttribute('class', `skater-link skater-result-${index}`);
    document.body.appendChild(testElement);

    giveElementFocusedClass(index);
    expect(testElement.getAttribute('class')).toBe(expectedClass);

})

test('Asserts that the searchResults JSON object is properly refined to exclude results w/o urls', () => {
    const mockedSearchResults = [
        {
            dateAdded: 1603287377972,
            dateGroupModified: 1603287377972,
            id: "12",
            index: 5,
            parentId: "1",
            title: "test_folder"
        },
        {
            dateAdded: 1603287435587,
            id: "13",
            index: 6,
            parentId: "1",
            title: "TEST_youtube",
            url: "https://www.youtube.com/"
        }
    ]
    const refinedResults = refineResults(mockedSearchResults, 'tEsT');
    expect(refinedResults.length).toBe(1);
    expect(refinedResults[0].url).toBe("https://www.youtube.com/");
})
