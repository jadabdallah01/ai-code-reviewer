# AI Code Reviewer

A lightweight, self-hosted code review tool: paste or upload a code snippet, and an LLM (via the Groq API) flags the most significant issue in it — severity, what's wrong, and how to fix it.

## Aim

Give a quick, automated first pass on a piece of code without needing a full CI pipeline or a human reviewer on hand — useful for sanity-checking a snippet before it goes into a PR, or for spot-checking unfamiliar code.

## How it works

1. **Frontend** (`index.html` + `styles.css` + `script.js`) — a single page where you either drag/drop or click to upload a file, or paste code directly into a textarea. Whichever one you actually use is what gets sent; typing in the textarea clears a previously selected file.
2. **Backend** (`review.php`) — a PHP endpoint that:
   - Validates the request (must be `POST`, `Content-Type: application/json`, and include `code` + `file`).
   - Builds a prompt instructing the model to return exactly one review item as a strict JSON array.
   - Calls the Groq chat completions API (OpenAI-compatible) with that prompt.
   - Parses the model's response and returns it as JSON; falls back to a generic "low" severity error item if the API call fails or the model doesn't return valid JSON.
3. **Config** (`config.php`) — holds the API key, API URL, model name, temperature, and the allowed severity levels. Not committed to git (see `config.example.php` for the template).

## Response format

Each review is a JSON array with exactly one item:

```json
[
  {
    "severity": "low | medium | high",
    "file": "string",
    "issue": "short identifier of the most important problem",
    "suggestion": "concrete remediation step"
  }
]
```

## Project structure

```
config.example.php   # template config — commit this, not config.php
config.php            # your real config with your API key (gitignored)
review.php            # backend endpoint
index.html             # frontend page
styles.css             # frontend styling
script.js              # frontend logic
schema/schematic.js    # JSON schema describing the expected review item shape
test/test.js           # basic script that POSTs a sample snippet and checks the response shape
```

## Setup

1. Copy the config template and fill in your Groq API key:
   ```
   cp config.example.php config.php
   ```
   Edit `config.php` and set `api_key` to your real Groq key.
2. Start a PHP server from the project root:
   ```
   php -S localhost:8000
   ```
3. Open `http://localhost:8000/index.html` in a browser.

## Testing

- **Via the browser**: open `index.html`, paste or upload code, click Analyze.
- **Via curl**:
  ```
  curl -X POST -H "Content-Type: application/json" \
    -d '{"code":"eval(x)","file":"sample.py"}' \
    http://localhost:8000/review.php
  ```
- **Via the test script**: `node test/test.js` (requires Node 18+ for built-in `fetch`) — POSTs a sample snippet and checks the response has the required fields and a valid severity.

## Notes

- `config.php` is gitignored on purpose — never commit a real API key.
- Switching models/providers is a one-line change in `config.php` (`api_url` and `model`), since `review.php` reads both from config rather than hardcoding them.
