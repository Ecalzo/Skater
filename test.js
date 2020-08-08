
/**
 * 
 */
function test_search_reddit() {
	const searchInputELement = getSearchInputElement();
	searchInputELement.value = 'reddit';
	searchInputELement.dispatchEvent(
		new KeyboardEvent('keyup', {
			key: 'Enter',
		}),
	);
}

function test_search_bookmarks() {

}

function test() {
	test_search_reddit();
	console.log('Success');
}
