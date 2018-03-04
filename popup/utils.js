window.post = function (url, params, callback, errorCallback) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);

	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				callback();
			} else {
				errorCallback();
			}
		}
	};

	xhr.send(JSON.stringify(params));
};

window.isValidURL = function (url, matches, noMatches) {
	for (var i = noMatches.length - 1; i >= 0; i--) {
		if (noMatches[i].test(url)) {

			return false;
		}
	}

	var urlRegex;

	for (var j = matches.length - 1; j >= 0; j--) {
		urlRegex = new RegExp('^' + matches[j].replace(/\*/g, '.*') + '$');

		if (urlRegex.test(url)) {

			return true;
		}
	}

	return false;
};

window.noop = function () {
};

window.closeExtension = function (timeout) {
	timeout = timeout ? timeout : 0;

	setTimeout(function () {
		window.close();
	}, timeout);
};

window.$ = function (id) {
	return document.getElementById(id);
};

window.show = function (id) {
	$(id).style.display = 'block';
};

window.hide = function (id) {
	$(id).style.display = 'none';
};