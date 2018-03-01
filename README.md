# Basic Screenshot Chrome extension

## Usage
- Go to chrome://extension
- Enable development mode
- Browse the extension
- Use it as any other extension - Click on it

## Expected behavior
The extension will make a screenshot and send it to the URL configured in <code>config.js</code> file.
Change it to send it to your own server.
In addition, the extension also extracts some default details from the DOM. Feel free to update the
<code>fetch-client-details.js</code> file in order to extract any data you want from the DOM. The data that gets extracted, is appended to the <code>POST</code> Method.
