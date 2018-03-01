FetchClientDetailsAPI = (function () {
	function fetch(tab, callback, errorCallback, progress, splitNotifier) {
		chrome.tabs.executeScript(tab.id, {file: '/tabs-executions/fetch-client-details.js'}, function (result) {
			if (result[0]) {
				progress(1);
				callback(result[0]);

				return true;
			}
			else {
				errorCallback('internal error');

				return false;
			}
		});

	}

	return {fetch: fetch};
})();