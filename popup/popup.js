var currentTab;

var numberOfProcesses = 2;
var processesProgress = 0;
var data = {};

function $(id) {
	return document.getElementById(id);
}

function show(id) {
	$(id).style.display = 'block';
}

function hide(id) {
	$(id).style.display = 'none';
}

function onCaptureEnd(imageDataURL) {
	if (!imageDataURL) {
		show('uh-oh');
	} else {
		sendCaptureToServer(imageDataURL);
	}
}

function onDetailsFetchingEnd(response) {
	data.details = response;
}

function sendCaptureToServer(imageDataURL) {
	data.imageDataURL = imageDataURL;
}

function errorHandler(reason) {
	show('uh-oh');
}

function progress(complete) {
	if (processesProgress === 0) {
		show('loading');

		processesProgress += complete / numberOfProcesses;
	}
	else {
		processesProgress += complete / numberOfProcesses;

		$('bar').style.width = parseInt(processesProgress * 100, 10) + '%';

		if (processesProgress === 1) {
			onAllProccessesFinished();
		}
	}
}

function splitNotifier() {
	show('split-image');
}

function onAllProccessesFinished() {
	post(config.sendDetailsToURL, data);
}

chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
	var tab = tabs[0];
	currentTab = tab;

	FetchClientDetailsAPI.fetch(tab, onDetailsFetchingEnd, errorHandler, progress, splitNotifier);

	ScreenshotAPI.takeScreenshot(tab, onCaptureEnd,
		errorHandler, progress, splitNotifier);
});
