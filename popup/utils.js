window.post = function (url, params) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);

	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4 && xhr.status === 200) {
			alert(xhr.responseText);
		}
	};

	xhr.send(JSON.stringify(params));
};