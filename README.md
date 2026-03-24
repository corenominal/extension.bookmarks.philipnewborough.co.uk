# PN Bookmarker

A browser extension (Manifest V3) for saving bookmarks to the [Philip Newborough bookmarks service](https://bookmarks.philipnewborough.co.uk/).

## Features

- **One-click bookmarking** — click the toolbar icon to open a bookmark form pre-filled with the current tab's title and URL.
- **Rich metadata** — add a title, URL, Markdown-compatible notes, and one or more tags.
- **Duplicate detection** — checks the remote API before saving and warns if the URL already exists.
- **Tag management** — type comma-separated tags or pick from existing tags fetched from the API.
- **Privacy & dashboard flags** — mark bookmarks as private or pin them to the dashboard.
- **Settings screen** — stores your User UUID and API key in browser local storage; shown automatically when credentials are not yet configured.

## Requirements

- Firefox or any Chromium-based browser with Manifest V3 support.
- An account and API key from [auth.philipnewborough.co.uk/admin/apikeys](https://auth.philipnewborough.co.uk/admin/apikeys).

## Installation

1. Clone or download this repository.
2. In your browser, open the extensions management page and enable **Developer mode**.
3. Click **Load unpacked** and select the repository root directory.
4. Click the **PN Bookmarker** toolbar icon; you will be prompted to enter your User UUID and API key on first use.

## Development

### Refreshing vendor assets

Vendor CSS, JS, and font files are included in the repository. To refresh them to the latest versions, run:

```bash
npm run fetch-vendors
```

This re-downloads the following files from `assets.philipnewborough.co.uk`:

| Destination | File |
|-------------|------|
| `assets/css/vendor/bootstrap.css` | Bootstrap CSS |
| `assets/css/vendor/bootstrap-icons.css` | Bootstrap Icons CSS |
| `assets/css/vendor/fonts/bootstrap-icons.woff2` | Bootstrap Icons font |
| `assets/js/vendor/bootstrap.bundle.min.js` | Bootstrap JS bundle |

Node.js is required (no additional dependencies — the script uses only built-in modules).

## Project Structure

```
manifest.json          # Extension manifest (Manifest V3)
index.html             # Bookmark form UI
assets/
  css/main.css         # Custom styles
  css/vendor/          # Third-party CSS (Bootstrap, Bootstrap Icons)
  images/              # Extension icons (16–128 px)
  js/
    background.js      # Service worker — captures tab info and opens the UI
    main.js            # Form logic, API calls, tag helpers, notifications
    storage-shim.js    # Fallback shim for chrome.storage during local testing
  js/vendor/           # Third-party JS (Bootstrap bundle)
scripts/
  fetch-vendors.js     # Refreshes vendor assets from assets.philipnewborough.co.uk
```

## API

The extension communicates with the following endpoints on `bookmarks.philipnewborough.co.uk`:

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/bookmarks/check-url` | Check whether a URL is already bookmarked |
| `GET`  | `/api/tags` | Fetch the list of existing tags |
| `POST` | `/api/bookmarks` | Save a new bookmark |

All requests are authenticated via `apikey` and `user-uuid` HTTP headers.

## License

Licensed under the [GNU General Public License v3.0](LICENSE).

