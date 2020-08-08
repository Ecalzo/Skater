# Dashboard
Spotlight-like Chrome extension for bookmarks

## TODO
### Concept:
Press a hotkey while in chrome, ex: CMD + Enter. A searchbar-like tool pops up and the user enters the name of an existing bookmark they have. After hitting enter, they are brought to that bookmark in a new tab.

### How to:
* Read Bookmarks ~ in progress
* Popup UI on hotkey ~ kinda done

### Design
* HTML will handle the appearance of the search bar, mostly
* JS will fire on keypress filtering bookmarks -> this needs to be FAST
* Enter keypress -> new tab is opened with the selected bookmark 