import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Sparkles, History, Loader, AlertCircle, Settings, X, Heart, Shield, Trash2, Key, ArrowRight, Filter, BookMarked } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TRIES = [
  'Books like Sapiens',
  'Stoic philosophy',
  'Magical realism short stories',
  'Beginner machine learning',
  'Books that feel like Studio Ghibli',
];

function App() {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('nl_groq_api_key') || import.meta.env.VITE_GROQ_API_KEY || '';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState('discover');
  const [readHistory, setReadHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nl_history') || '[]'); } catch { return []; }
  });
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nl_favs') || '[]'); } catch { return []; }
  });
  const [recs, setRecs] = useState([]);
  const [results, setResults] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [tempKey, setTempKey] = useState('');

  useEffect(() => { localStorage.setItem('nl_history', JSON.stringify(readHistory)); }, [readHistory]);
  useEffect(() => { localStorage.setItem('nl_favs', JSON.stringify(favorites)); }, [favorites]);

  const fetchBook = async (title, author) => {
    try {
      const q = encodeURIComponent(`${title} ${author}`);
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`);
      const data = await res.json();
      if (data.items?.length) {
        const v = data.items[0].volumeInfo;
        return {
          id: data.items[0].id || Math.random().toString(),
          title: v.title || title,
          author: v.authors ? v.authors.join(', ') : author,
          description: v.description || '',
          coverUrl: v.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
          category: v.categories?.[0] || 'Literature',
          year: v.publishedDate ? v.publishedDate.slice(0, 4) : '',
        };
      }
    } catch (e) { console.error(e); }
    return { id: Math.random().toString(), title, author, description: 'A highly recommended book.', coverUrl: null, category: 'Book', year: '' };
  };

  const markRead = (book) => {
    setReadHistory((p) => p.find((b) => b.id === book.id) ? p : [book, ...p]);
  };

  const toggleFav = (book) => {
    setFavorites((p) => p.find((b) => b.id === book.id) ? p.filter((b) => b.id !== book.id) : [book, ...p]);
  };

  const genRecs = async () => {
    if (!apiKey || !readHistory.length) return;
    setLoadingRecs(true); setError('');
    const titles = readHistory.map((b) => `"${b.title}" by ${b.author}`).join(', ');
    try {
      const r = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: `You are an expert librarian AI. User read: ${titles}. Recommend 4 REAL books. Return ONLY raw JSON array: [{"title":"Title","author":"Author","reason":"Reason"}]. NO markdown.` }], temperature: 0.7 }),
      });
      if (!r.ok) {
        const errText = await r.text();
        if (r.status === 401) throw new Error('API Key Invalid (401). Please check your Groq API key.');
        if (r.status === 429) throw new Error('API Quota Exceeded (429). Please wait a moment.');
        throw new Error(`API error: ${errText}`);
      }
      const d = await r.json();
      const content = d.choices[0].message.content;
      const parsed = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
      const enriched = await Promise.all(parsed.map(async (x) => ({ ...await fetchBook(x.title, x.author), aiReason: x.reason })));
      setRecs(enriched);
    } catch (e) { console.error(e); setError(e.message.includes('API') ? e.message : 'Error generating recommendations.'); }
    finally { setLoadingRecs(false); }
  };

  useEffect(() => { if (readHistory.length && apiKey) genRecs(); }, [readHistory]);

  const doSearch = async (query) => {
    if (!query?.trim() || !apiKey) { if (!apiKey) setError('Add your Groq API key in Settings.'); return; }
    setLoadingSearch(true); setError(''); setTab('discover');
    try {
      const r = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: `You are an expert librarian AI. Find 6 best REAL books for: "${query}". Return ONLY raw JSON array: [{"title":"Title","author":"Author","matchScore":"95%","reason":"Reason"}]. NO markdown.` }], temperature: 0.3 }),
      });
      if (!r.ok) {
        const errText = await r.text();
        if (r.status === 401) throw new Error('API Key Invalid (401). Please check your Groq API key.');
        if (r.status === 429) throw new Error('API Quota Exceeded (429). Please wait a moment.');
        throw new Error(`API error: ${errText}`);
      }
      const d = await r.json();
      const content = d.choices[0].message.content;
      const parsed = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
      const enriched = await Promise.all(parsed.map(async (x) => ({ ...await fetchBook(x.title, x.author), aiReason: x.reason, matchScore: x.matchScore })));
      setResults(enriched);
    } catch (e) { console.error(e); setError(e.message.includes('API') ? e.message : 'Error performing AI search.'); }
    finally { setLoadingSearch(false); }
  };

  const handleSubmit = (e) => { e.preventDefault(); doSearch(searchQuery); };
  const handleTry = (q) => { setSearchQuery(q); doSearch(q); };
  const clearAll = () => { setReadHistory([]); setFavorites([]); setRecs([]); setResults([]); localStorage.removeItem('nl_history'); localStorage.removeItem('nl_favs'); };
  const saveKey = () => { localStorage.setItem('nl_groq_api_key', tempKey); setApiKey(tempKey); setModal(false); };
  const openModal = () => { setTempKey(apiKey); setModal(true); };

  const isSearching = results.length > 0 || loadingSearch;

  return (
    <>
      {/* NAVBAR */}
      <nav className="nav">
        <div className="nav-brand">
          <div className="nav-logo" style={{fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--accent)', fontWeight: 600}}>||</div>
          <div>
            <div className="nav-title">BookPilot AI</div>
            <div className="nav-sub">Vol. 01 — AI Reading Companion</div>
          </div>
        </div>
        <div className="nav-links">
          <button className={`nav-pill${tab === 'discover' ? ' active' : ''}`} onClick={() => setTab('discover')}>Discover</button>
          <button className={`nav-pill${tab === 'favorites' ? ' active' : ''}`} onClick={() => setTab('favorites')}>Favorites · {favorites.length}</button>
          <button className={`nav-pill${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>History · {readHistory.length}</button>
        </div>
        <div className="nav-right">
          <div className="status-pill"><span className="status-dot" />{apiKey ? 'AI Online' : 'Key Needed'}</div>
          <button className="gear-btn" onClick={openModal}><Settings size={17} /></button>
        </div>
      </nav>

      <div className="wrap">
        {/* DISCOVER */}
        {tab === 'discover' && (
          <main>
            {/* HERO */}
            <div className="hero-row">
              <div>
                <div className="hero-label"><Sparkles size={13} /> Issue 01 · Curated by Llama 3.1 8B</div>
                <h1 className="hero-h1">A library that<br /><em>reads you</em> back.</h1>
                <p className="hero-p">Type a feeling, a concept, an unfinished sentence. The AI scans the world's catalogue and brings back books worth your next quiet hour.</p>

                <form onSubmit={handleSubmit} className="search-wrap">
                  <Search className="s-icon" size={17} />
                  <input className="search-input" placeholder="A novel about loneliness in cities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} id="main-search" />
                  <button type="submit" className="search-btn" disabled={loadingSearch}>
                    {loadingSearch ? <Loader className="spin" size={15} /> : <><span>Search</span><ArrowRight size={14} /></>}
                  </button>
                </form>

                {results.length > 0 && <button className="clear-link" onClick={() => { setResults([]); setSearchQuery(''); }}>← Clear search results</button>}

                <div className="try-row">
                  <span className="try-label">Try</span>
                  {TRIES.map((t) => <button key={t} className="try-pill" onClick={() => handleTry(t)}>{t}</button>)}
                </div>
              </div>

              {/* STATS CARD */}
              <div className="stats-card">
                <div className="stats-head"><span className="status-dot" /> Live Feed</div>
                <div className="stats-grid">
                  <div className="stat-item"><div className="stat-val">40M+</div><div className="stat-lbl">Catalogue<br/>Google Books</div></div>
                  <div className="stat-item"><div className="stat-val">6 / query</div><div className="stat-lbl">Match Depth<br/>AI-Ranked</div></div>
                  <div className="stat-item"><div className="stat-val">≈ 2s</div><div className="stat-lbl">Latency<br/>End-to-End</div></div>
                  <div className="stat-item"><div className="stat-val">Llama 3.1 8B</div><div className="stat-lbl">Model<br/>Groq</div></div>
                </div>
                <div className="stats-quote">
                  <blockquote>"Tell me what you read, and I'll tell you what you've been <span>avoiding</span>."</blockquote>
                  <cite>— The Librarian</cite>
                </div>
              </div>
            </div>

            {error && <div className="err"><AlertCircle size={15} /> {error}</div>}

            {/* SEARCH RESULTS */}
            {isSearching && (
              <section>
                <div className="sec-header">
                  <div className="sec-label"><span className="dot" /> Search Results</div>
                </div>
                {loadingSearch ? (
                  <div className="empty"><div className="empty-icon"><Loader className="spin" size={20} /></div><h3>Searching the catalogue…</h3><p>The AI librarian is finding the best books for you.</p></div>
                ) : (
                  <motion.div layout className="books-grid">
                    <AnimatePresence>{results.map((b, i) => <BookCard key={`s-${b.id}`} book={b} i={i} onRead={() => markRead(b)} onFav={() => toggleFav(b)} fav={!!favorites.find(f => f.id === b.id)} isSearch />)}</AnimatePresence>
                  </motion.div>
                )}
              </section>
            )}

            {/* RECS */}
            <AnimatePresence>
              {!isSearching && readHistory.length > 0 && (
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="sec-header">
                    <div className="sec-label"><span className="dot" /> AI Recommended</div>
                    {loadingRecs && <div className="loading-i"><Loader className="spin" size={13} /> Generating…</div>}
                  </div>
                  <div className="books-grid">
                    {recs.map((b, i) => <BookCard key={`r-${b.id}`} book={b} i={i} onRead={() => markRead(b)} onFav={() => toggleFav(b)} fav={!!favorites.find(f => f.id === b.id)} isRec />)}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* EMPTY STATE */}
            {!isSearching && !readHistory.length && (
              <section>
                <div className="sec-label" style={{ marginTop: '1rem' }}><span className="dot" /> Begin · Reading</div>
                <h2 className="sec-title">Start anywhere</h2>
                <p className="sec-sub">Search above, or browse a curated tab.</p>
                <div className="empty">
                  <div className="empty-icon"><Sparkles size={20} /></div>
                  <h3>Ready when you are</h3>
                  <p>Search above for any theme, mood, or concept. The Librarian will return six titles ranked by semantic match.</p>
                </div>
              </section>
            )}

            {/* HISTORY CHIPS */}
            {readHistory.length > 0 && !isSearching && (
              <section style={{ marginTop: '1rem' }}>
                <div className="sec-label"><span className="dot" /> Recently Read</div>
                <div style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                  {readHistory.map((b) => <span key={b.id} className="try-pill" style={{ cursor: 'default' }}>{b.title}</span>)}
                </div>
              </section>
            )}
          </main>
        )}

        {/* FAVORITES TAB */}
        {tab === 'favorites' && (
          <main style={{ marginTop: '80px', paddingTop: '2rem' }}>
            <div className="sec-label"><span className="dot" /> Saved · Heart</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 className="sec-title">Your favorites</h2>
                <p className="sec-sub" style={{ marginBottom: 0 }}>The books you've starred for later.</p>
              </div>
              <button className="filter-btn"><Filter size={13} /> All Categories <span style={{ marginLeft: '.15rem' }}>↓</span></button>
            </div>
            {favorites.length ? (
              <div className="books-grid">{favorites.map((b, i) => <BookCard key={b.id} book={b} i={i} onRead={() => markRead(b)} onFav={() => toggleFav(b)} fav />)}</div>
            ) : (
              <div className="empty"><div className="empty-icon"><Heart size={20} /></div><h3>No favorites yet</h3><p>Heart some books to save them here.</p><button className="btn-outline" onClick={() => setTab('discover')}>Find your first book</button></div>
            )}
          </main>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <main style={{ marginTop: '80px', paddingTop: '2rem' }}>
            <div className="sec-label"><span className="dot" /> Archive · Read</div>
            <h2 className="sec-title">Recently read</h2>
            <p className="sec-sub">A record of where your attention has been.</p>
            {readHistory.length ? (
              <div className="books-grid">{readHistory.map((b, i) => <BookCard key={b.id} book={b} i={i} onRead={() => markRead(b)} onFav={() => toggleFav(b)} fav={!!favorites.find(f => f.id === b.id)} />)}</div>
            ) : (
              <div className="empty"><div className="empty-icon"><BookMarked size={20} /></div><h3>Your library is empty</h3><p>Mark a book as read to start building a personal archive. The AI will use it to recommend new threads.</p><button className="btn-outline" onClick={() => setTab('discover')}>Find your first book</button></div>
            )}
          </main>
        )}

        <footer className="foot">
          <div className="foot-l">BookPilot AI · MMXXVI</div>
          <div className="foot-r">Powered by Groq · Google Books · Quiet Thinking</div>
        </footer>
      </div>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {modal && (
          <motion.div className="modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(false)}>
            <motion.div className="modal" initial={{ opacity: 0, scale: .96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 8 }} onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setModal(false)}><X size={15} /></button>
              <h3>Connect the Librarian</h3>
              <div className="modal-sub">Settings · API · Library</div>

              <div className="modal-field">
                <label><Key size={12} /> Groq API Key</label>
                <input className="modal-inp" type="password" value={tempKey} onChange={(e) => setTempKey(e.target.value)} placeholder="Paste your Groq API key…" />
              </div>

              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="modal-link">Get a free key ↗</a>

              <div className="modal-info">
                <Shield size={16} className="modal-info-icon" />
                <p>Your key stays in this browser (localStorage). Requests go directly from your device to Groq. No server in the middle.</p>
              </div>

              <div className="modal-danger">
                <div className="modal-danger-label">Danger Zone</div>
                <button className="btn-danger" onClick={clearAll}><Trash2 size={13} /> Clear all reading data</button>
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setModal(false)}>Cancel</button>
                <button className="btn-save" onClick={saveKey}>Save key</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const ICONS = ['📖', '🧠', '✦', '🌿', '🔮', '📚'];

const BookCard = ({ book, i, onRead, onFav, fav, isRec, isSearch }) => (
  <motion.div layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} transition={{ duration: .3, delay: i * .05 }} className="bk">
    {isSearch && book.matchScore && <div className="bk-match">{book.matchScore} Match</div>}
    <button className={`bk-heart${fav ? ' fav' : ''}`} onClick={(e) => { e.stopPropagation(); onFav(); }}>
      <Heart size={14} fill={fav ? '#fff' : 'none'} color="#fff" />
    </button>

    <div className="bk-cover">
      {book.coverUrl ? <img src={book.coverUrl} alt={book.title} /> : <div className="bk-cover-fallback">{ICONS[i % ICONS.length]}</div>}
      <div className="bk-cover-grad" />
      <div className="bk-cover-info">
        <div className="bk-cover-cat">{book.category}</div>
        <div className="bk-cover-title">{book.title}</div>
      </div>
    </div>

    <div className="bk-body">
      <div className="bk-meta">
        <span className="bk-author">{book.author}</span>
        {book.year && <span className="bk-year">{book.year}</span>}
      </div>
      <p className="bk-desc">{book.description}</p>

      {(isRec || isSearch) && book.aiReason && (
        <div className="bk-reason">
          <div className="bk-reason-label"><Sparkles size={11} /> Why This</div>
          <div className="bk-reason-text">{book.aiReason}</div>
        </div>
      )}

      <div className="bk-actions">
        <button className="btn-read" onClick={onRead}><BookOpen size={14} /> Mark as Read</button>
      </div>
    </div>
  </motion.div>
);

export default App;
