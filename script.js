const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const dropzoneLabel = document.getElementById('dropzoneLabel');
const filenameDisplay = document.getElementById('filenameDisplay');
const codeInput = document.getElementById('codeInput');
const filenameInput = document.getElementById('filenameInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const errorBox = document.getElementById('errorBox');
const statusBox = document.getElementById('statusBox');
const results = document.getElementById('results');

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('drag');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('drag');
  if (e.dataTransfer.files.length > 0) {
    fileInput.files = e.dataTransfer.files;
    updateFileLabel();
  }
});
fileInput.addEventListener('change', updateFileLabel);

function updateFileLabel() {
  if (fileInput.files.length > 0) {
    filenameDisplay.textContent = "Selected: " + fileInput.files[0].name;
  } else {
    filenameDisplay.textContent = "";
  }
}

function clearFile() {
  fileInput.value = "";
  filenameDisplay.textContent = "";
}

// Typing in the textarea means the user wants to use pasted code instead of the file.
codeInput.addEventListener('input', () => {
  if (codeInput.value.trim() && fileInput.files.length > 0) {
    clearFile();
  }
});

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = msg ? 'block' : 'none';
}

function severityBadge(sev) {
  const s = (sev || '').toLowerCase();
  const cls = ['low', 'medium', 'high'].includes(s) ? s : 'low';
  return `<span class="badge ${cls}">${s || 'unknown'}</span>`;
}

function renderResults(items) {
  results.innerHTML = '';
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-head">
        ${severityBadge(item.severity)}
        <span class="card-file">${item.file ?? ''}</span>
      </div>
      <div class="card-issue">${item.issue ?? ''}</div>
      <div class="card-suggestion">${item.suggestion ?? ''}</div>
    `;
    results.appendChild(card);
  });
}

analyzeBtn.addEventListener('click', async () => {
  showError('');
  results.innerHTML = '';
  statusBox.textContent = '';

  let code, file;

  try {
    if (fileInput.files.length > 0) {
      const f = fileInput.files[0];
      code = await f.text();
      file = f.name;
    } else if (codeInput.value.trim()) {
      code = codeInput.value;
      file = filenameInput.value.trim() || 'snippet.py';
    } else {
      showError('Upload a file or paste some code first.');
      return;
    }
  } catch (err) {
    showError('Could not read the file: ' + err.message);
    return;
  }

  analyzeBtn.disabled = true;
  statusBox.textContent = 'Analyzing...';

  try {
    const resp = await fetch('review.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, file })
    });
    const data = await resp.json();

    if (data && data.error) {
      showError(data.error);
    } else if (Array.isArray(data)) {
      renderResults(data);
    } else {
      showError('Unexpected response from server.');
    }
  } catch (err) {
    showError('Request failed: ' + err.message);
  } finally {
    analyzeBtn.disabled = false;
    statusBox.textContent = '';
  }
});
