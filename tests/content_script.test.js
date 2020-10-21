const {
    isValidInputEvent,
    stripIndexFromClass,
    stripFocusFromClass
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