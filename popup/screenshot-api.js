window.ScreenshotAPI = (function () {
	var MAX_AREA = config.maxPrimaryDimension * config.maxSecondaryDimension;

	var matches = ['http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*'];
	var noMatches = [/^https?:\/\/chrome.google.com\/.*$/];

	function takeScreenshot(tab, callback, errorCallback, progress, splitNotifier) {
		var loaded = false;
		var screenshots = [];
		var timedOut = false;

		callback = callback || noop;
		errorCallback = errorCallback || noop;
		progress = progress || noop;

		if (!isValidURL(tab.url, matches, noMatches)) {
			errorCallback('invalid url');
		}

		chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
			if (request.msg === 'capture') {
				_capture(request, screenshots, sendResponse, splitNotifier);

				return true;
			} else {
				errorCallback('internal error');

				return false;
			}
		});

		chrome.tabs.executeScript(tab.id, {file: '/tabs-executions/screenshot.js'}, function () {
			if (timedOut) {
				console.error('Timed out too early while waiting for ' +
					'chrome.tabs.executeScript. Try increasing the timeout.');
			} else {
				loaded = true;

				_initiateCapture(tab, function () {
					callback(screenshots[0].canvas.toDataURL());
					progress(1);
				});
			}
		});

		window.setTimeout(function () {
			if (!loaded) {
				timedOut = true;
				errorCallback('execute timeout');
			}
		}, config.timeout);
	}

	return {
		takeScreenshot: takeScreenshot
	};

	function _initiateCapture(tab, callback) {
		chrome.tabs.sendMessage(tab.id, {msg: 'scrollPage'}, callback);
	}

	function _capture(data, screenshots, sendResponse, splitNotifier) {
		chrome.tabs.captureVisibleTab(
			null, {format: 'png', quality: 100}, function (dataURI) {
				if (dataURI) {
					var image = new Image();

					image.onload = _setImageProperties(data, image, screenshots, splitNotifier, sendResponse);

					image.src = dataURI;
				}
			});
	}

	function _setImageProperties(data, image, screenshots, splitNotifier, sendResponse) {
		return function () {
			data.image = {width: image.width, height: image.height};

			// given device mode emulation or zooming, we may end up with
			// a different sized image than expected, so let's adjust to
			// match it!
			if (data.windowWidth !== image.width) {
				var scale = image.width / data.windowWidth;
				data.x *= scale;
				data.y *= scale;
				data.totalWidth *= scale;
				data.totalHeight *= scale;
			}

			// lazy initialization of screenshot canvases (since we need to wait
			// for actual image size)
			if (!screenshots.length) {
				Array.prototype.push.apply(
					screenshots,
					_initScreenshots(data.totalWidth, data.totalHeight)
				);

				if (screenshots.length > 1) {
					if (splitNotifier) {
						splitNotifier();
					}

					$('screenshot-count').innerText = screenshots.length;
				}
			}

			// draw it on matching screenshot canvases
			_filterScreenshots(
				data.x, data.y, image.width, image.height, screenshots
			).forEach(function (screenshot) {
				screenshot.ctx.drawImage(
					image,
					data.x - screenshot.left,
					data.y - screenshot.top
				);
			});

			// send back log data for debugging (but keep it truthy to
			// indicate success)
			sendResponse(JSON.stringify(data, null, 4) || true);
		};
	}

	function _initScreenshots(totalWidth, totalHeight) {
		// Create and return an array of screenshot objects based
		// on the `totalWidth` and `totalHeight` of the final image.
		// We have to account for multiple canvases if too large,
		// because Chrome won't generate an image otherwise.

		var badSize = _isBadSize(totalHeight, totalWidth);
		var biggerWidth = totalWidth > totalHeight;
		var maxWidth = (!badSize ? totalWidth :
			(biggerWidth ? config.maxPrimaryDimension : config.maxSecondaryDimension));
		var maxHeight = (!badSize ? totalHeight :
			(biggerWidth ? config.maxSecondaryDimension : config.maxPrimaryDimension));
		var numCols = Math.ceil(totalWidth / maxWidth);
		var numRows = Math.ceil(totalHeight / maxHeight);
		var row;
		var col;
		var canvas;
		var left;
		var top;

		var canvasIndex = 0;
		var result = [];

		for (row = 0; row < numRows; row++) {
			for (col = 0; col < numCols; col++) {
				canvas = document.createElement('canvas');

				canvas.width = (col === numCols - 1 ? totalWidth % maxWidth || maxWidth :
					maxWidth);
				canvas.height = (row === numRows - 1 ? totalHeight % maxHeight || maxHeight :
					maxHeight);

				left = col * maxWidth;
				top = row * maxHeight;

				result.push({
					canvas: canvas,
					ctx: canvas.getContext('2d'),
					index: canvasIndex,
					left: left,
					right: left + canvas.width,
					top: top,
					bottom: top + canvas.height
				});

				canvasIndex++;
			}
		}

		return result;
	}

	function _isBadSize(totalHeight, totalWidth) {
		return (totalHeight > config.maxPrimaryDimension ||
			totalWidth > config.maxPrimaryDimension ||
			totalHeight * totalWidth > MAX_AREA);
	}

	function _filterScreenshots(imgLeft, imgTop, imgWidth, imgHeight, screenshots) {
		// Filter down the screenshots to ones that match the location
		// of the given image.
		var imgRight = imgLeft + imgWidth;
		var imgBottom = imgTop + imgHeight;

		return screenshots.filter(function (screenshot) {
			return (imgLeft < screenshot.right &&
				imgRight > screenshot.left &&
				imgTop < screenshot.bottom &&
				imgBottom > screenshot.top);
		});
	}
})();