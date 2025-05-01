import { useState, useEffect, useRef } from 'react';
import './mind.css';

function App() {
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('minddump-notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [newNote, setNewNote] = useState('');
  const [editNoteId, setEditNoteId] = useState(null);
  const [editText, setEditText] = useState('');
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('minddump-theme') === 'dark');
  const [lastDeleted, setLastDeleted] = useState(null);
  const [tag, setTag] = useState('');
  const fileInputRef = useRef();

  useEffect(() => {
    localStorage.setItem('minddump-notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : '';
    localStorage.setItem('minddump-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const now = Date.now();
    notes.forEach(note => {
      if (note.reminder && now > note.reminder && !note.reminded) {
        alert(`⏰ Reminder: ${note.text}`);
        note.reminded = true;
      }
    });
  }, [notes]);

  const addNote = () => {
    if (newNote.trim() === '') return;
    setNotes([{ id: Date.now(), text: newNote, pinned: false, tag, image: null }, ...notes]);
    setNewNote('');
    setTag('');
  };

  const deleteNote = (id) => {
    const deleted = notes.find(note => note.id === id);
    setLastDeleted(deleted);
    setNotes(notes.filter(note => note.id !== id));
  };

  const undoDelete = () => {
    if (lastDeleted) {
      setNotes([lastDeleted, ...notes]);
      setLastDeleted(null);
    }
  };

  const editNote = (id) => {
    setEditNoteId(id);
    setEditText(notes.find(note => note.id === id).text);
  };

  const saveEdit = () => {
    setNotes(notes.map(note =>
      note.id === editNoteId ? { ...note, text: editText } : note
    ));
    setEditNoteId(null);
    setEditText('');
  };

  const togglePin = (id) => {
    setNotes(
      notes.map(note =>
        note.id === id ? { ...note, pinned: !note.pinned } : note
      )
    );
  };

  const handleSpeech = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.start();
    recognition.onresult = (event) => {
      setNewNote(event.results[0][0].transcript);
    };
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setNotes([{ id: Date.now(), text: newNote, image: reader.result, pinned: false }, ...notes]);
      setNewNote('');
    };
    reader.readAsDataURL(file);
  };

  const exportNotes = () => {
    const blob = new Blob([JSON.stringify(notes)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'minddump-notes.json';
    a.click();
  };

  const importNotes = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        setNotes(imported);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const filteredNotes = notes
    .filter(note => note.text.toLowerCase().includes(search.toLowerCase()) || note.tag?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.pinned - a.pinned);

  return (
    <div className="container">
      <h1>🧠 MindDump</h1>
      <div className="top-controls">
        <input type="text" placeholder="Type your thought..." value={newNote} onChange={(e) => setNewNote(e.target.value)} />
        <input type="text" placeholder="Tag..." value={tag} onChange={(e) => setTag(e.target.value)} />
        <button onClick={addNote}>Add</button>
        <button onClick={handleSpeech}>🎤</button>
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button onClick={() => setDarkMode(!darkMode)}>{darkMode ? '🌞' : '🌙'}</button>
        {lastDeleted && <button onClick={undoDelete}>↩️ Undo</button>}
        <button onClick={exportNotes}>⬇️ Export</button>
        <button onClick={() => fileInputRef.current.click()}>⬆️ Import</button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={importNotes} />
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>
      <div className="notes">
        {filteredNotes.length === 0 && <p>No notes found.</p>}
        {filteredNotes.map((note) => (
          <div key={note.id} className="note">
            {editNoteId === note.id ? (
              <>
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} />
                <button onClick={saveEdit}>Save</button>
              </>
            ) : (
              <>
                <p>{note.text}</p>
                {note.image && <img src={note.image} alt="Note visual" />}
                {note.tag && <span className="tag">{note.tag}</span>}
                <div className="note-actions">
                  <button onClick={() => editNote(note.id)}>✏️</button>
                  <button onClick={() => deleteNote(note.id)}>🗑️</button>
                  <button onClick={() => togglePin(note.id)}>{note.pinned ? '📌' : '📍'}</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
