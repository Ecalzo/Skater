function isValidInputEvent(key) {
    const isAlphabetical = (key >= "a" && key <= "z") || (key >= "A" && key <= "Z") && key.length === 1;
    const isNumeric = (key >= "0" && key <= "9");
    const isBackspace = (key === "Backspace");
    const isEnter = (key === "Enter");
    const isShift = (key === "Shift");
    const isArrowKey = (['ArrowUp', 'Up', 'ArrowDown', 'Down', 'ArrowLeft', 'Left', 'ArrowRight', 'Right'].includes(key))
    return (isAlphabetical || isNumeric || isBackspace || isEnter || isShift) && !isArrowKey
}

function stripIndexFromClass(element) {
    const classString = element.getAttribute('class').split(' ')[1].split('-'); 
    return parseInt(classString[classString.length - 1]);
}

function stripFocusFromClass(classString) {
    const rootClassList = classString.split(' ');
    if (classString.length > 2) {
        return rootClassList.slice(0, 2).join(' ');
    } else {
        return classString
    }
}


function giveElementFocusedClass(index) {
    const focusedElement = document.querySelector(`.skater-result-${index}`);
    focusedElement.setAttribute('class', `skater-link skater-result-${index} skater-focused`);
}

module.exports = {
    isValidInputEvent,
    stripIndexFromClass,
    stripFocusFromClass,
    giveElementFocusedClass
}
