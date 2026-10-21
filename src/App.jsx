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
const shuffle = (items) => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
const questionBank = [
  { q: 'Playfair is an example of which cipher type?', options: ['Transposition', 'Digraph substitution', 'Modern block cipher'], answer: 1, explain: 'It encrypts two letters at a time using a 5×5 key square.' },
  { q: 'Why does the key square contain 25 cells?', options: ['Digits are included', 'I and J share a cell', 'Q is omitted'], answer: 1, explain: 'The 26-letter alphabet is reduced by combining I and J.' },
  { q: 'What happens when both letters in a pair are identical?', options: ['Insert a filler between them', 'Delete one letter', 'Leave the pair unchanged'], answer: 0, explain: 'A filler separates repeated letters so each digraph has two different letters.' },
  { q: 'How are same-row pairs encrypted?', options: ['Shift right', 'Shift left', 'Swap rows'], answer: 0, explain: 'Each letter moves one place right, wrapping around at the row end.' },
  { q: 'What is the rectangle rule?', options: ['Swap the letters', 'Use opposite corners in the same rows', 'Shift down'], answer: 1, explain: 'Each letter takes the other letter’s column while staying in its own row.' },
  { q: 'How does decryption reverse the same-row rule?', options: ['Shift left', 'Shift down', 'Use the next row'], answer: 0, explain: 'Decryption reverses row and column shifts.' },
  { q: 'Who invented the cipher?', options: ['Charles Wheatstone', 'Alan Turing', 'Lord Byron'], answer: 0, explain: 'Charles Wheatstone invented it; Lord Playfair promoted it.' },
  { q: 'What is one weakness of Playfair?', options: ['It cannot use a keyword', 'Digraph frequency patterns can be analyzed', 'It only works with numbers'], answer: 1, explain: 'Common letter pairs can still reveal patterns.' },
  { q: 'How is the key square usually filled after the keyword?', options: ['With unused alphabet letters in order', 'With the keyword repeated', 'With numbers from 1 to 25'], answer: 0, explain: 'After the unique keyword letters, add the remaining letters of the alphabet in order.' },
  { q: 'What should be done with repeated letters in a keyword?', options: ['Keep every occurrence', 'Use only the first occurrence', 'Replace them with X'], answer: 1, explain: 'The key square contains each letter once, so later repetitions are removed.' },
  { q: 'Which letter is commonly used to split a repeated-letter digraph?', options: ['X', 'Z', 'A'], answer: 0, explain: 'X is a common filler, though some implementations use another letter when needed.' },
  { q: 'What is commonly added when plaintext has an odd number of letters?', options: ['A filler letter at the end', 'A copy of the last pair', 'A blank cell'], answer: 0, explain: 'A filler such as X completes the final two-letter group.' },
  { q: 'What does the cipher do with the letter J in a common 5×5 square?', options: ['Combines it with I', 'Combines it with Z', 'Removes it from plaintext'], answer: 0, explain: 'I and J share a cell so the alphabet fits into 25 positions.' },
  { q: 'If a plaintext pair is in the same column, how is it encrypted?', options: ['Move each letter down one row', 'Move each letter right one column', 'Swap their positions'], answer: 0, explain: 'For a same-column pair, each letter moves down one row, wrapping at the bottom.' },
  { q: 'What happens at the right edge when encrypting a same-row pair?', options: ['Wrap to the first cell in that row', 'Move to the next row', 'Stay in the last cell'], answer: 0, explain: 'The row rule wraps around to the beginning of the same row.' },
  { q: 'What happens at the bottom edge when encrypting a same-column pair?', options: ['Wrap to the top of that column', 'Move to the next column', 'Stay in the bottom cell'], answer: 0, explain: 'The column rule wraps around to the top of the same column.' },
  { q: 'For a rectangle pair, where does each output letter go?', options: ['In the same row and the other letter’s column', 'In the other letter’s row and column', 'One cell diagonally away'], answer: 0, explain: 'Each letter stays in its original row and switches to the other letter’s column.' },
  { q: 'Why are plaintext letters split into pairs before encryption?', options: ['Playfair transforms digraphs', 'The key square has two rows', 'It removes the need for a key'], answer: 0, explain: 'Playfair applies its substitution rules to two-letter groups.' },
  { q: 'Which rule is used when the two letters occupy different rows and columns?', options: ['Rectangle rule', 'Same-row rule', 'Same-column rule'], answer: 0, explain: 'Different-row, different-column pairs use the rectangle rule.' },
  { q: 'What information is needed to decrypt Playfair ciphertext?', options: ['The corresponding key square', 'Only the ciphertext length', 'The original punctuation'], answer: 0, explain: 'Decryption uses the same key square as encryption, applying the inverse shifts.' },
  { q: 'How are same-column pairs decrypted?', options: ['Move each letter up one row', 'Move each letter down one row', 'Swap their columns'], answer: 0, explain: 'Decryption moves letters up in a column, wrapping from the top to the bottom.' },
  { q: 'Does the rectangle rule change direction during decryption?', options: ['No, it is the same transformation', 'Yes, reverse both rows', 'Yes, move each letter down'], answer: 0, explain: 'The rectangle transformation is its own inverse, so the same rule decrypts it.' },
  { q: 'Why can decrypted text contain extra filler letters?', options: ['Fillers were inserted during plaintext preparation', 'The key square adds letters', 'Ciphertext is always longer'], answer: 0, explain: 'Fillers used to separate repeats or complete a final pair may remain in the decrypted text.' },
  { q: 'What does a keyword primarily determine?', options: ['The arrangement of letters in the key square', 'The number of plaintext pairs', 'The direction of every rule'], answer: 0, explain: 'Unique keyword letters are placed first and determine the key-square arrangement.' },
  { q: 'Which statement about Playfair security is most accurate?', options: ['It is a historical cipher, not suitable for modern secure communication', 'It is unbreakable with a long keyword', 'It provides modern authenticated encryption'], answer: 0, explain: 'Playfair is useful for learning classical cryptography but is not secure by modern standards.' },
  { q: 'What kind of pattern does Playfair hide better than a simple monoalphabetic substitution?', options: ['Single-letter frequency patterns', 'The message length', 'All repeated patterns'], answer: 0, explain: 'Because it encrypts pairs, it obscures direct single-letter substitution patterns, but it is still breakable.' },
  { q: 'Who gave the cipher its name and promoted its use?', options: ['Lord Playfair', 'Charles Babbage', 'Julius Caesar'], answer: 0, explain: 'Lord Playfair promoted the cipher, which was invented by Charles Wheatstone.' },
  { q: 'What is a digraph?', options: ['A group of two letters', 'A 5×5 grid', 'A repeated keyword'], answer: 0, explain: 'A digraph is a pair of letters, the unit transformed by the Playfair cipher.' },
  { q: 'When preparing text, what is commonly done to punctuation and spaces?', options: ['They are removed before pairing letters', 'They are added to the key square', 'They are encrypted as digraphs'], answer: 0, explain: 'Playfair implementations commonly keep letters only before forming digraphs.' },
  { q: 'What is a common challenge when reading decrypted Playfair text?', options: ['Distinguishing original letters from inserted fillers', 'Recovering a numeric key', 'Determining the number of rows'], answer: 0, explain: 'The receiver may need context to tell which X or other filler letters were inserted.' },
].map((question, index) => ({
  ...question,
  difficulty: index < 10 ? 'easy' : index < 20 ? 'medium' : 'hard',
}));
const QUIZ_SIZE = 6;
function drawQuiz(remaining, current = []) {
  let pool = remaining;
  if (pool.length < QUIZ_SIZE) {
    pool = shuffle(questionBank.map((_, index) => index).filter((index) => !current.includes(index)));
  }
  return { questions: pool.slice(0, QUIZ_SIZE), remaining: pool.slice(QUIZ_SIZE) };
}
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
  const [quizRound, setQuizRound] = useState(() => drawQuiz(shuffle(questionBank.map((_, index) => index))));
  const [difficulty, setDifficulty] = useState('all');
  const [score, setScore] = useState(null);
  const [answers, setAnswers] = useState({});
  const grid = useMemo(() => buildMatrix(key), [key]);
  const displayedQuestions = difficulty === 'all'
    ? quizRound.questions
    : questionBank.map((_, index) => index).filter((index) => questionBank[index].difficulty === difficulty);

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
    setScore(displayedQuestions.reduce((total, questionIndex, index) => total + (Number(answers[index]) === questionBank[questionIndex].answer ? 1 : 0), 0));
  }
  function newQuiz() {
    setQuizRound((previous) => drawQuiz(previous.remaining, previous.questions));
    setAnswers({});
    setScore(null);
  }
  function changeDifficulty(event) {
    setDifficulty(event.target.value);
    setAnswers({});
    setScore(null);
  }
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
        <section id="quiz"><div className="eyebrow">06</div><h2>Q</h2><p className="intro">Choose a difficulty to view all questions at that level, or select All levels for a six-question random round.</p><div className="field"><label htmlFor="quizDifficulty">Difficulty</label><select id="quizDifficulty" value={difficulty} onChange={changeDifficulty}><option value="all">All levels · random round</option><option value="easy">Easy · 10 questions</option><option value="medium">Medium · 10 questions</option><option value="hard">Hard · 10 questions</option></select></div><div id="quizContainer">{displayedQuestions.map((questionIndex, qi) => { const item = questionBank[questionIndex]; return <Card className="quiz-card" key={questionIndex}><div className="q-title">{qi + 1}. {item.q} <span className="tag">{item.difficulty}</span></div>{item.options.map((option, oi) => <label className={`opt ${score !== null && oi === item.answer ? 'correct' : ''} ${score !== null && Number(answers[qi]) === oi && oi !== item.answer ? 'incorrect' : ''}`} key={option}><input type="radio" name={`q${qi}`} checked={Number(answers[qi]) === oi} onChange={() => setAnswers({ ...answers, [qi]: oi })} /> <span>{option}</span></label>)}{score !== null && <div className="quiz-explain show">{item.explain}</div>}</Card>; })}</div><div className="btn-row"><button className="primary" onClick={checkAnswers}>Check answers</button>{difficulty === 'all' && <button className="ghost" onClick={newQuiz}>New questions</button>}</div>{score !== null && <div className="quiz-score show">Score: {score} / {displayedQuestions.length}</div>}</section>
        <section id="references"><div className="eyebrow">07</div><h2>References</h2><Card><ol className="refs"><li>Stallings, W. <em>Cryptography and Network Security: Principles and Practice.</em> Pearson Education.</li><li>Kahn, D. <em>The Codebreakers: The Story of Secret Writing.</em> Scribner.</li><li>Forouzan, B. A. <em>Cryptography and Network Security.</em> McGraw-Hill.</li><li>GeeksforGeeks, “Playfair Cipher with Examples.”</li><li>Wikipedia contributors, “Playfair cipher.”</li></ol></Card></section>
        <footer>Playfair Cipher Virtual Lab · for educational use</footer>
      </main>
    </div>
  </div>;
}
export default App;
