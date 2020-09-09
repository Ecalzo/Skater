function isValidInputEvent(key) {
    const isAlphabetical = (key >= "a" && key <= "z") || (key >= "A" && key <= "Z");
    const isNumeric = (key >= "0" && key <= "9");
    const isBackspace = (key === "Backspace");
    const isEnter = (key === "Enter");
    const isShift = (key === "Shift");
    return isAlphabetical || isNumeric || isBackspace || isEnter || isShift
}

module.exports = {
    isValidInputEvent
}
