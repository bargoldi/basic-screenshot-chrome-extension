var CAPTURE_DELAY = 150;

function onMessage(data, sender, callback) {
	if (data.msg === 'scrollPage') {
		getPositions(callback);

		return true;
	} else {
		console.error('Unknown message received from background: ' + data.msg);
	}
}

if (!window.hasScreenCapturePage) {
	window.hasScreenCapturePage = true;
	chrome.runtime.onMessage.addListener(onMessage);
}

function max(nums) {
	return Math.max.apply(Math, nums.filter(function (x) {
		return x;
	}));
}

function getPositions(callback) {
	var body = document.body;
	var originalBodyOverflowYStyle = body ? body.style.overflowY : '';
	var originalX = window.scrollX;
	var originalY = window.scrollY;
	var originalOverflowStyle = document.documentElement.style.overflow;

	// try to make pages with bad scrolling work, e.g., ones with
	// `body { overflow-y: scroll; }` can break `window.scrollTo`
	if (body) {
		body.style.overflowY = 'visible';
	}

	var widths = [
		document.documentElement.clientWidth,
		body ? body.scrollWidth : 0,
		document.documentElement.scrollWidth,
		body ? body.offsetWidth : 0,
		document.documentElement.offsetWidth
	];
	var heights = [
		document.documentElement.clientHeight,
		body ? body.scrollHeight : 0,
		document.documentElement.scrollHeight,
		body ? body.offsetHeight : 0,
		document.documentElement.offsetHeight
		// (Array.prototype.slice.call(document.getElementsByTagName('*'), 0)
		//  .reduce(function(val, elt) {
		//      var h = elt.offsetHeight; return h > val ? h : val;
		//  }, 0))
	];
	var fullWidth = max(widths);
	var fullHeight = max(heights);
	var windowWidth = window.innerWidth;
	var windowHeight = window.innerHeight;
	var arrangements = [];
	var scrollPad = 200;
	var yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0);
	var xDelta = windowWidth;
	var yPos = fullHeight - windowHeight;
	var xPos;
	var numArrangements;

	// During zooming, there can be weird off-by-1 types of things...
	if (fullWidth <= xDelta + 1) {
		fullWidth = xDelta;
	}

	// Disable all scrollbars. We'll restore the scrollbar state when we're done
	// taking the screenshots.
	document.documentElement.style.overflow = 'hidden';

	while (yPos > -yDelta) {
		xPos = 0;
		while (xPos < fullWidth) {
			arrangements.push([xPos, yPos]);
			xPos += xDelta;
		}
		yPos -= yDelta;
	}

	numArrangements = arrangements.length;

	function cleanUp() {
		document.documentElement.style.overflow = originalOverflowStyle;
		if (body) {
			body.style.overflowY = originalBodyOverflowYStyle;
		}
		window.scrollTo(originalX, originalY);
	}

	(function processArrangements() {
		if (!arrangements.length) {
			cleanUp();
			if (callback) {
				callback();
			}
			return;
		}

		var next = arrangements.shift(),
			x = next[0], y = next[1];

		window.scrollTo(x, y);

		var data = {
			msg: 'capture',
			x: window.scrollX,
			y: window.scrollY,
			complete: (numArrangements - arrangements.length) / numArrangements,
			windowWidth: windowWidth,
			totalWidth: fullWidth,
			totalHeight: fullHeight,
			devicePixelRatio: window.devicePixelRatio
		};

		window.setTimeout(function () {
			// In case the below callback never returns, cleanup
			var cleanUpTimeout = window.setTimeout(cleanUp, 1250);

			chrome.runtime.sendMessage(data, function (captured) {
				window.clearTimeout(cleanUpTimeout);

				if (captured) {
					// Move on to capture next arrangement.
					processArrangements();
				} else {
					// If there's an error in popup.js, the response value can be
					// undefined, so cleanup
					cleanUp();
				}
			});

		}, CAPTURE_DELAY);
	})();
}