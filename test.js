// FIXME: this requires some project restructuring
// functions not dependent on the DOM should be moved out of popup.js

function assert(condition, message) {
	if (!condition) {
		message = message || "Assertion failed";
		if (typeof Error !== 'undefined') {
			throw new Error(message);
		}
		throw message;
	}
}

function test_search_reddit() {
	const searchInputELement = getSearchInputElement();
	searchInputELement.value = 'reddit';
	searchInputELement.dispatchEvent(
		new KeyboardEvent('keyup', {
			key: 'Enter',
		}),
	);
}


function test() {
	test_search_reddit();
	console.log('Success');
}


const searchResults = [
	{title: 'Jira', url: 'https://www.atlassian.com/software/jira'},
	{title: 'Folder', url: 'undefined'} // Firefox actually does this...
];
const query = 'ji';

function test_refineResults() {
	const refinedResults = refineResults(searchResults, query);
	assert(refinedResults.length, 1);
	assert(refinedResults[0].title === 'Jira');
}

test_refineResults();