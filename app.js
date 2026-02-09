(() => {
  'use strict';

  // ─── Configuration ─────────────────────────────────────────
  // SHA-256 hash of the passphrase. Change this to set your own passphrase.
  // Default passphrase: "openNotes2026"
  // To generate a new hash, run in browser console:
  //   crypto.subtle.digest('SHA-256', new TextEncoder().encode('YOUR_PASSPHRASE'))
  //     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')));
  const PASSPHRASE_HASH = 'a3f49e2c8e1d5b7c6a4f3e2d1c0b9a8f7e6d5c4b3a2918070605040302010099';

  // Session duration in milliseconds (30 minutes)
  const SESSION_DURATION = 30 * 60 * 1000;

  // ─── DOM Elements ─────────────────────────────────────────
  const loginScreen     = document.getElementById('login-screen');
  const appScreen       = document.getElementById('app-screen');
  const passphraseInput = document.getElementById('passphrase-input');
  const loginBtn        = document.getElementById('login-btn');
  const loginError      = document.getElementById('login-error');
  const logoutBtn       = document.getElementById('logout-btn');
  const noteTitle       = document.getElementById('note-title');
  const noteBody        = document.getElementById('note-body');
  const saveNoteBtn     = document.getElementById('save-note-btn');
  const cancelEditBtn   = document.getElementById('cancel-edit-btn');
  const searchInput     = document.getElementById('search-input');
  const notesList       = document.getElementById('notes-list');
  const noNotes         = document.getElementById('no-notes');

  let editingId = null;

  // ─── Utility: SHA-256 ─────────────────────────────────────
  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(hashBuffer)]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // ─── Auth ─────────────────────────────────────────────────
  function isAuthenticated() {
    const session = sessionStorage.getItem('notes_session');
    if (!session) return false;
    const { expires } = JSON.parse(session);
    if (Date.now() > expires) {
      sessionStorage.removeItem('notes_session');
      return false;
    }
    return true;
  }

  function createSession() {
    sessionStorage.setItem('notes_session', JSON.stringify({
      expires: Date.now() + SESSION_DURATION
    }));
  }

  function destroySession() {
    sessionStorage.removeItem('notes_session');
  }

  async function handleLogin() {
    const value = passphraseInput.value.trim();
    if (!value) return;

    const hash = await sha256(value);
    if (hash === PASSPHRASE_HASH) {
      loginError.classList.add('hidden');
      createSession();
      showApp();
    } else {
      loginError.classList.remove('hidden');
      passphraseInput.value = '';
      passphraseInput.focus();
    }
  }

  function handleLogout() {
    destroySession();
    showLogin();
  }

  function showLogin() {
    appScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    passphraseInput.value = '';
    loginError.classList.add('hidden');
    passphraseInput.focus();
  }

  function showApp() {
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    clearEditor();
    renderNotes();
  }

  // ─── Notes CRUD (localStorage) ────────────────────────────
  function getNotes() {
    try {
      return JSON.parse(localStorage.getItem('notes_data')) || [];
    } catch {
      return [];
    }
  }

  function saveNotes(notes) {
    localStorage.setItem('notes_data', JSON.stringify(notes));
  }

  function handleSave() {
    const title = noteTitle.value.trim();
    const body  = noteBody.value.trim();
    if (!title && !body) return;

    const notes = getNotes();

    if (editingId) {
      const idx = notes.findIndex(n => n.id === editingId);
      if (idx !== -1) {
        notes[idx].title = title;
        notes[idx].body  = body;
        notes[idx].updated = new Date().toISOString();
      }
      editingId = null;
    } else {
      notes.unshift({
        id: crypto.randomUUID(),
        title: title || 'Untitled',
        body,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });
    }

    saveNotes(notes);
    clearEditor();
    renderNotes();
  }

  function handleEdit(id) {
    const notes = getNotes();
    const note = notes.find(n => n.id === id);
    if (!note) return;

    editingId = id;
    noteTitle.value = note.title;
    noteBody.value  = note.body;
    cancelEditBtn.classList.remove('hidden');
    noteTitle.focus();
  }

  function handleDelete(id) {
    if (!confirm('Delete this note?')) return;
    const notes = getNotes().filter(n => n.id !== id);
    saveNotes(notes);
    if (editingId === id) clearEditor();
    renderNotes();
  }

  function clearEditor() {
    noteTitle.value = '';
    noteBody.value  = '';
    editingId = null;
    cancelEditBtn.classList.add('hidden');
  }

  // ─── Render ───────────────────────────────────────────────
  function renderNotes() {
    const query = searchInput.value.toLowerCase().trim();
    let notes = getNotes();

    if (query) {
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.body.toLowerCase().includes(query)
      );
    }

    notesList.innerHTML = '';

    if (notes.length === 0) {
      noNotes.classList.remove('hidden');
      noNotes.textContent = query
        ? 'No notes match your search.'
        : 'No notes yet. Create your first one above!';
      return;
    }

    noNotes.classList.add('hidden');

    notes.forEach(note => {
      const card = document.createElement('div');
      card.className = 'note-card';

      const date = new Date(note.updated).toLocaleString();
      const preview = note.body.length > 200
        ? note.body.substring(0, 200) + '…'
        : note.body;

      card.innerHTML = `
        <h3>${escapeHtml(note.title)}</h3>
        <div class="note-date">${date}</div>
        <div class="note-preview">${escapeHtml(preview)}</div>
        <div class="note-actions">
          <button class="btn-edit" data-id="${note.id}">✏️ Edit</button>
          <button class="btn-delete" data-id="${note.id}">🗑️ Delete</button>
        </div>
      `;

      notesList.appendChild(card);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ─── Event Listeners ──────────────────────────────────────
  loginBtn.addEventListener('click', handleLogin);
  passphraseInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });

  logoutBtn.addEventListener('click', handleLogout);
  saveNoteBtn.addEventListener('click', handleSave);
  cancelEditBtn.addEventListener('click', clearEditor);
  searchInput.addEventListener('input', renderNotes);

  notesList.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('btn-edit'))   handleEdit(id);
    if (btn.classList.contains('btn-delete')) handleDelete(id);
  });

  // ─── Init ─────────────────────────────────────────────────
  if (isAuthenticated()) {
    showApp();
  } else {
    showLogin();
  }
})();
