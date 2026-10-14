import React, { useEffect, useMemo, useState } from 'react';

const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
const sections = [
  ['aim', 'Aim'], ['objectives', 'Objectives'], ['theory', 'Theory'],
  ['procedure', 'Procedure'], ['simulation', 'Simulation'], ['quiz', 'Q'], ['references', 'References'],
];

function buildMatrix(key) {
  const chars = (key.toUpperCase().replace(/J/g, 'I').match(/[A-Z]/g) || []);
  const letters = [...new Set([...chars, ...alphabet])].slice(0, 25);
  return Array.from({ length: 5 }, (_, row) => letters.slice(row * 5, row * 5 + 5));
}
function prepareEncrypt(text) {
  const letters = (text.toUpperCase().replace(/J/g, 'I').match(/[A-Z]/g) || []);
  const pairs = [];
  for (let i = 0; i < letters.length;) {
    const a = letters[i], b = letters[i + 1];
    if (!b) { pairs.push([a, 'X']); i++; }
    else if (a === b) { pairs.push([a, a === 'X' ? 'Q' : 'X']); i++; }
    else { pairs.push([a, b]); i += 2; }
  }
  return pairs;
}
function prepareDecrypt(text) {
  const letters = (text.toUpperCase().replace(/J/g, 'I').match(/[A-Z]/g) || []);
  if (letters.length % 2) letters.push('X');
  const pairs = [];
  for (let i = 0; i < letters.length; i += 2) pairs.push([letters[i], letters[i + 1]]);
  return pairs;
}
function position(grid, letter) {
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (grid[r][c] === letter) return [r, c];
}
function transform(grid, [a, b], mode) {
  const [r1, c1] = position(grid, a), [r2, c2] = position(grid, b), d = mode === 'encrypt' ? 1 : -1;
  if (r1 === r2) return [grid[r1][(c1 + d + 5) % 5], grid[r2][(c2 + d + 5) % 5], 'row', r1, c1, r2, c2, r1, (c1 + d + 5) % 5, r2, (c2 + d + 5) % 5];
  if (c1 === c2) return [grid[(r1 + d + 5) % 5][c1], grid[(r2 + d + 5) % 5][c2], 'col', r1, c1, r2, c2, (r1 + d + 5) % 5, c1, (r2 + d + 5) % 5, c2];
  return [grid[r1][c2], grid[r2][c1], 'rect', r1, c1, r2, c2, r1, c2, r2, c1];
}
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const questionBank = [
  { q: 'Playfair is an example of which cipher type?', options: ['Transposition', 'Digraph substitution', 'Modern block cipher'], answer: 1, explain: 'It encrypts two letters at a time using a 5×5 key square.' },
  { q: 'Why does the key square contain 25 cells?', options: ['Digits are included', 'I and J share a cell', 'Q is omitted'], answer: 1, explain: 'The 26-letter alphabet is reduced by combining I and J.' },
  { q: 'What happens when both letters in a pair are identical?', options: ['Insert a filler between them', 'Delete one letter', 'Leave the pair unchanged'], answer: 0, explain: 'A filler separates repeated letters so each digraph has two different letters.' },
  { q: 'How are same-row pairs encrypted?', options: ['Shift right', 'Shift left', 'Swap rows'], answer: 0, explain: 'Each letter moves one place right, wrapping around at the row end.' },
  { q: 'What is the rectangle rule?', options: ['Swap the letters', 'Use opposite corners in the same rows', 'Shift down'], answer: 1, explain: 'Each letter takes the other letter’s column while staying in its own row.' },
  { q: 'How does decryption reverse the same-row rule?', options: ['Shift left', 'Shift down', 'Use the next row'], answer: 0, explain: 'Decryption reverses row and column shifts.' },
  { q: 'Who invented the cipher?', options: ['Charles Wheatstone', 'Alan Turing', 'Lord Byron'], answer: 0, explain: 'Charles Wheatstone invented it; Lord Playfair promoted it.' },
  { q: 'What is one weakness of Playfair?', options: ['It cannot use a keyword', 'Digraph frequency patterns can be analyzed', 'It only works with numbers'], answer: 1, explain: 'Common letter pairs can still reveal patterns.' },
];
const examples = [
  { key: 'MONARCHY', message: 'Instruments' },
  { key: 'PLAYFAIREXAMPLE', message: 'Hide the gold in the tree stump' },
  { key: 'KEYWORD', message: 'Attack at dawn' },
];

function Card({ children, className = '' }) { return <div className={`card ${className}`}>{children}</div>; }
function App() {
  const [theme, setTheme] = useState('light');
  const [mode, setMode] = useState('encrypt');
  const [key, setKey] = useState('MONARCHY');
  const [message, setMessage] = useState('Instruments');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('aim');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [highlight, setHighlight] = useState(0);
  const [quiz, setQuiz] = useState(() => shuffle(questionBank).slice(0, 6));
  const [score, setScore] = useState(null);
  const [answers, setAnswers] = useState({});
  const grid = useMemo(() => buildMatrix(key), [key]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => {
      const current = sections.filter(([id]) => document.getElementById(id)?.getBoundingClientRect().top < 150).at(-1)?.[0] || 'aim';
      setActiveSection(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function runCipher() {
    setError('');
    if (!/[a-z]/i.test(key)) { setError('Enter a key containing at least one letter.'); setResult(null); return; }
    if (!/[a-z]/i.test(message)) { setError('Enter a message containing at least one letter.'); setResult(null); return; }
    const pairs = mode === 'encrypt' ? prepareEncrypt(message) : prepareDecrypt(message);
    const rows = pairs.map((pair) => transform(grid, pair, mode));
    setResult({ pairs, rows, output: rows.map(([a, b]) => a + b).join('') });
    setHighlight(0);
  }
  function loadExample() {
    const index = (exampleIndex + 1) % examples.length;
    setExampleIndex(index);
    setKey(examples[index].key);
    setMessage(mode === 'encrypt' ? examples[index].message : 'GATLMZCLRQTX');
  }
  function checkAnswers() {
    setScore(quiz.reduce((total, item, index) => total + (Number(answers[index]) === item.answer ? 1 : 0), 0));
  }
  function newQuiz() { setQuiz(shuffle(questionBank).slice(0, 6)); setAnswers({}); setScore(null); }
  const activeStep = result?.rows[highlight];
  const ruleDescription = activeStep && ({
    row: `Same row: shift each letter ${mode === 'encrypt' ? 'right' : 'left'} by one cell.`,
    col: `Same column: shift each letter ${mode === 'encrypt' ? 'down' : 'up'} by one cell.`,
    rect: 'Rectangle: keep each letter in its row and use the other letter’s column.',
  }[activeStep[2]]);

  return <div data-theme={theme}>
    <header className="topbar">
      <div className="brand"><div className="brand-mark">{Array.from({ length: 25 }, (_, i) => <span key={i} />)}</div><div className="brand-text"><div className="k">Virtual Lab</div><div className="n">Playfair Cipher</div></div></div>
      <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? 'Dark mode' : 'Light mode'}</button>
    </header>
    <div className="layout">
      <nav className="index"><ol>{sections.map(([id, label]) => <li key={id}><a className={activeSection === id ? 'active' : ''} href={`#${id}`}>{label}</a></li>)}</ol></nav>
      <main>
        <div className="hero"><div><h1>The Playfair Cipher</h1><p className="lede">A hands-on laboratory for the classical digraph substitution cipher. Build a key square, then encrypt and decrypt messages letter-pair by letter-pair.</p><div className="hero-tags"><span className="tag">5×5 KEY SQUARE</span><span className="tag">DIGRAPH SUBSTITUTION</span><span className="tag">1854 · WHEATSTONE</span></div></div><div className="hero-demo"><div className="label">Worked example · key: MONARCHY</div>{[['IN','GA'],['ST','YB'],['RU','CM'],['ME','NT']].map(([a,b]) => <div className="pair-row" key={a}><span>{a}</span><span className="arrow">→</span><span className="cipher-out">{b}</span></div>)}</div></div>

        <section id="aim"><div className="eyebrow">01</div><h2>Aim</h2><Card><p style={{ marginTop: 0 }}>To study how the Playfair cipher uses a keyword-based 5×5 key square to encrypt and decrypt pairs of letters.</p></Card></section>
        <section id="objectives"><div className="eyebrow">02</div><h2>Objectives</h2><Card><ul className="obj-list"><li>Construct a 5×5 key square from a keyword, merging I and J.</li><li>Prepare a plaintext message as digraphs, handling repeated letters and odd-length messages.</li><li>Apply the same-row, same-column, and rectangle rules to encrypt a message.</li><li>Reverse the rules to decrypt ciphertext.</li><li>Explain the cipher’s strengths and limitations.</li></ul></Card></section>
        <section id="theory"><div className="eyebrow">03</div><h2>Theoretical concepts</h2><p className="intro">Charles Wheatstone invented the Playfair cipher in 1854; Lord Playfair promoted its use. It encrypts pairs of letters, which makes basic single-letter frequency analysis less effective.</p><div className="theory-block"><h3>The key square</h3><p>Unique keyword letters come first, followed by the remaining alphabet. I and J share one cell.</p></div><div className="theory-block"><h3>Preparing the message</h3><p>Text is converted to uppercase, punctuation is removed, and J is treated as I. Repeated letters are separated with a filler, and an odd final letter is paired with a filler.</p></div><div className="rule-cards">{[['Same row','Move each letter one place right when encrypting.'],['Same column','Move each letter one place down when encrypting.'],['Rectangle','Swap the columns while each letter stays in its own row.']].map(([title, text]) => <div className="rule-card" key={title}><div className="rc-title">{title}</div><p style={{ margin: 0 }}>{text}</p></div>)}</div><div className="theory-block"><h3>Decryption</h3><p>Reverse row and column shifts; the rectangle rule is unchanged.</p></div></section>
        <section id="procedure"><div className="eyebrow">04</div><h2>Step-by-step procedure</h2><p className="intro">Follow the steps, then compare your work in the simulation.</p><Card><ol className="steps">{[['Choose a keyword','Remove spaces and repeated letters; treat J as I.'],['Build the key square','Fill a 5×5 grid with keyword letters, then unused letters.'],['Prepare the message','Remove punctuation, convert J to I, and split into digraphs.'],['Locate each pair','Find the row and column of both letters.'],['Apply a rule','Use the row, column, or rectangle transformation.'],['Assemble the result','Join the output pairs in order.']].map(([title, text]) => <li key={title}><div><h4>{title}</h4><p>{text}</p></div></li>)}</ol></Card></section>
        <section id="simulation"><div className="eyebrow">05</div><h2>Simulation</h2><p className="intro">Enter a keyword and message. Run the cipher, then select a pair to follow the matching cells and rule.</p><div className="sim-wrap"><Card><div className="mode-toggle" aria-label="Cipher mode"><button className={`mode-btn ${mode === 'encrypt' ? 'active' : ''}`} aria-pressed={mode === 'encrypt'} onClick={() => { setMode('encrypt'); setResult(null); }}>Encrypt</button><button className={`mode-btn ${mode === 'decrypt' ? 'active' : ''}`} aria-pressed={mode === 'decrypt'} onClick={() => { setMode('decrypt'); setResult(null); }}>Decrypt</button></div><div className="field"><label htmlFor="keyInput">Key</label><input id="keyInput" type="text" value={key} onChange={(e) => { setKey(e.target.value); setResult(null); }} /></div><div className="field"><label htmlFor="msgInput">{mode === 'encrypt' ? 'Plaintext message' : 'Ciphertext message'}</label><textarea id="msgInput" rows="3" value={message} onChange={(e) => { setMessage(e.target.value); setResult(null); }} /></div><div className="btn-row"><button className="primary" onClick={runCipher}>Run cipher</button><button className="ghost" onClick={() => { setMessage(''); setResult(null); setError(''); }}>Clear</button><button className="example-link" onClick={loadExample}>Load another example</button></div><div className="error-msg" role="alert">{error}</div>{result && <><div className="result-box"><div className="r-label">{mode === 'encrypt' ? 'Prepared plaintext digraphs' : 'Ciphertext digraphs'}</div><div className="result-text">{result.pairs.map((p) => p.join('')).join('  ')}</div></div><div className="result-box"><div className="r-label">{mode === 'encrypt' ? 'Ciphertext' : 'Recovered plaintext'}</div><div className="result-text">{result.output.match(/.{1,5}/g)?.join('  ')}</div></div><div className="rule-explainer" aria-live="polite"><span className={`rule-pill ${activeStep?.[2]}`}>Step {highlight + 1} · {activeStep?.[2] === 'col' ? 'column' : activeStep?.[2]}</span><p>{activeStep && <><strong>{result.pairs[highlight].join('')}</strong> becomes <strong>{activeStep[0] + activeStep[1]}</strong>. {ruleDescription}</>}</p></div><div className="steps-table-wrap"><table className="steps-table"><thead><tr><th>#</th><th>Pair</th><th>Rule</th><th>Result</th></tr></thead><tbody>{result.rows.map((row, i) => <tr className={highlight === i ? 'selected' : ''} key={i} onClick={() => setHighlight(i)} onKeyDown={(event) => event.key === 'Enter' && setHighlight(i)} tabIndex={0}><td>{i + 1}</td><td>{result.pairs[i].join('')}</td><td><span className={`rule-pill ${row[2]}`}>{row[2] === 'col' ? 'column' : row[2]}</span></td><td>{row[0] + row[1]}</td></tr>)}</tbody></table></div></>}</Card><Card className="matrix-panel"><div className="matrix-title">Key square</div><div className="matrix">{grid.flatMap((row, r) => row.map((letter, c) => <div className={`cell ${activeStep && r === activeStep[3] && c === activeStep[4] ? 'in-a' : ''} ${activeStep && r === activeStep[5] && c === activeStep[6] ? 'in-b' : ''} ${activeStep && r === activeStep[7] && c === activeStep[8] ? 'out-a' : ''} ${activeStep && r === activeStep[9] && c === activeStep[10] ? 'out-b' : ''}`} key={`${r}-${c}`} title={letter === 'I' ? 'I / J' : undefined}>{letter}</div>))}</div><div className="legend"><span><i className="li-in" /> input pair</span><span><i className="li-out" /> output pair</span></div>{activeStep ? <p className="note">{result.pairs[highlight].join('')} → {activeStep[0] + activeStep[1]} · I and J share one cell.</p> : <p className="note">I and J share one cell.</p>}</Card></div></section>
        <section id="quiz"><div className="eyebrow">06</div><h2>Q</h2><p className="intro">Check your understanding of the Playfair cipher.</p><div id="quizContainer">{quiz.map((item, qi) => <Card className="quiz-card" key={`${item.q}-${qi}`}><div className="q-title">{qi + 1}. {item.q}</div>{item.options.map((option, oi) => <label className={`opt ${score !== null && oi === item.answer ? 'correct' : ''} ${score !== null && Number(answers[qi]) === oi && oi !== item.answer ? 'incorrect' : ''}`} key={option}><input type="radio" name={`q${qi}`} checked={Number(answers[qi]) === oi} onChange={() => setAnswers({ ...answers, [qi]: oi })} /> <span>{option}</span></label>)}{score !== null && <div className="quiz-explain show">{item.explain}</div>}</Card>)}</div><div className="btn-row"><button className="primary" onClick={checkAnswers}>Check answers</button><button className="ghost" onClick={newQuiz}>New Q</button></div>{score !== null && <div className="quiz-score show">Score: {score} / {quiz.length}</div>}</section>
        <section id="references"><div className="eyebrow">07</div><h2>References</h2><Card><ol className="refs"><li>Stallings, W. <em>Cryptography and Network Security: Principles and Practice.</em> Pearson Education.</li><li>Kahn, D. <em>The Codebreakers: The Story of Secret Writing.</em> Scribner.</li><li>Forouzan, B. A. <em>Cryptography and Network Security.</em> McGraw-Hill.</li><li>GeeksforGeeks, “Playfair Cipher with Examples.”</li><li>Wikipedia contributors, “Playfair cipher.”</li></ol></Card></section>
        <footer>Playfair Cipher Virtual Lab · for educational use</footer>
      </main>
    </div>
  </div>;
}
export default App;
