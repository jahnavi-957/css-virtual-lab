(function(){
  "use strict";

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeToggle');
  themeBtn.addEventListener('click', function(){
    var current = root.getAttribute('data-theme');
    var isDark = current === 'dark' || (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if(isDark){ root.setAttribute('data-theme','light'); themeBtn.textContent='Dark mode'; }
    else { root.setAttribute('data-theme','dark'); themeBtn.textContent='Light mode'; }
  });

  /* ---------- Scrollspy ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('nav.index a'));
  var sections = navLinks.map(function(a){ return document.querySelector(a.getAttribute('href')); });
  function onScroll(){
    var pos = window.scrollY + 110;
    var current = sections[0];
    sections.forEach(function(s){ if(s && s.offsetTop <= pos) current = s; });
    navLinks.forEach(function(a){
      a.classList.toggle('active', current && a.getAttribute('href') === '#' + current.id);
    });
  }
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---------- Playfair core ---------- */
  function buildMatrix(key){
    var clean = (key || '').toUpperCase().replace(/[^A-Z]/g,'').replace(/J/g,'I');
    var seen = {};
    var letters = [];
    for(var i=0;i<clean.length;i++){
      var ch = clean[i];
      if(!seen[ch]){ seen[ch]=true; letters.push(ch); }
    }
    for(var c=65;c<=90;c++){
      var ch2 = String.fromCharCode(c);
      if(ch2==='J') continue;
      if(!seen[ch2]){ seen[ch2]=true; letters.push(ch2); }
    }
    var grid = [];
    for(var r=0;r<5;r++){ grid.push(letters.slice(r*5, r*5+5)); }
    return grid;
  }

  function findPos(grid, ch){
    if(ch==='J') ch='I';
    for(var r=0;r<5;r++){
      for(var c=0;c<5;c++){
        if(grid[r][c]===ch) return [r,c];
      }
    }
    return null;
  }

  function prepareForEncrypt(text){
    var letters = (text||'').toUpperCase().replace(/[^A-Z]/g,'').replace(/J/g,'I').split('');
    var pairs = [];
    var i = 0;
    while(i < letters.length){
      var a = letters[i];
      var b = (i+1 < letters.length) ? letters[i+1] : null;
      if(b === null){
        pairs.push([a,'X']);
        i += 1;
      } else if(a === b){
        pairs.push([a,'X']);
        i += 1;
      } else {
        pairs.push([a,b]);
        i += 2;
      }
    }
    return pairs;
  }

  function prepareForDecrypt(text){
    var letters = (text||'').toUpperCase().replace(/[^A-Z]/g,'').replace(/J/g,'I').split('');
    if(letters.length % 2 !== 0) letters.push('X');
    var pairs = [];
    for(var i=0;i<letters.length;i+=2){
      pairs.push([letters[i], letters[i+1]]);
    }
    return pairs;
  }

  function processPair(grid, a, b, mode){
    var p1 = findPos(grid,a), p2 = findPos(grid,b);
    var r1=p1[0], c1=p1[1], r2=p2[0], c2=p2[1];
    var dir = (mode==='encrypt') ? 1 : -1;
    var rule, outA, outB;
    if(r1 === r2){
      rule = 'row';
      outA = grid[r1][ (c1+dir+5)%5 ];
      outB = grid[r2][ (c2+dir+5)%5 ];
    } else if(c1 === c2){
      rule = 'col';
      outA = grid[ (r1+dir+5)%5 ][c1];
      outB = grid[ (r2+dir+5)%5 ][c2];
    } else {
      rule = 'rect';
      outA = grid[r1][c2];
      outB = grid[r2][c1];
    }
    return { a:a,b:b, r1:r1,c1:c1,r2:r2,c2:c2, rule:rule, outA:outA, outB:outB };
  }

  /* ---------- UI wiring ---------- */
  var mode = 'encrypt';
  var modeEncryptBtn = document.getElementById('modeEncrypt');
  var modeDecryptBtn = document.getElementById('modeDecrypt');
  var msgLabel = document.getElementById('msgLabel');
  var msgInput = document.getElementById('msgInput');
  var keyInput = document.getElementById('keyInput');
  var errorMsg = document.getElementById('errorMsg');
  var resultBox = document.getElementById('resultBox');
  var resultLabel = document.getElementById('resultLabel');
  var resultText = document.getElementById('resultText');
  var stepsTable = document.getElementById('stepsTable');
  var stepsBody = document.getElementById('stepsBody');
  var matrixGrid = document.getElementById('matrixGrid');
  var matrixNote = document.getElementById('matrixNote');

  function setMode(m){
    mode = m;
    modeEncryptBtn.classList.toggle('active', m==='encrypt');
    modeDecryptBtn.classList.toggle('active', m==='decrypt');
    msgLabel.textContent = (m==='encrypt') ? 'Plaintext message' : 'Ciphertext message';
    if(m==='encrypt' && msgInput.value.trim()==='ZKFOKQAB'){ msgInput.value='Instruments'; }
    if(m==='decrypt' && msgInput.value.trim().toUpperCase()==='INSTRUMENTS'){ msgInput.value='GATLMZCLRQTX'; }
    resultBox.style.display='none';
    stepsTable.style.display='none';
    errorMsg.textContent='';
  }
  modeEncryptBtn.addEventListener('click', function(){ setMode('encrypt'); });
  modeDecryptBtn.addEventListener('click', function(){ setMode('decrypt'); });

  function renderMatrix(grid, highlight){
    matrixGrid.innerHTML='';
    for(var r=0;r<5;r++){
      for(var c=0;c<5;c++){
        var div = document.createElement('div');
        var letter = grid[r][c];
        div.className='cell';
        div.textContent = (letter==='I') ? 'I' : letter;
        if(letter==='I') div.title='I / J';
        if(highlight){
          if(r===highlight.r1 && c===highlight.c1) div.classList.add('in-a');
          if(r===highlight.r2 && c===highlight.c2) div.classList.add('in-b');
          if(highlight.rule==='row' && (r===highlight.r1 || r===highlight.r2)) div.classList.add('line-row');
          if(highlight.rule==='col' && (c===highlight.c1 || c===highlight.c2)) div.classList.add('line-col');
          if(highlight.outR1!==undefined && r===highlight.outR1 && c===highlight.outC1) div.classList.add('out-a');
          if(highlight.outR2!==undefined && r===highlight.outR2 && c===highlight.outC2) div.classList.add('out-b');
        }
        matrixGrid.appendChild(div);
      }
    }
  }

  function ruleLabel(rule){
    if(rule==='row') return '<span class="rule-pill row">row</span>';
    if(rule==='col') return '<span class="rule-pill col">column</span>';
    return '<span class="rule-pill rect">rectangle</span>';
  }

  function outPos(grid, rule, r1,c1,r2,c2, dir){
    if(rule==='row'){
      return { outR1:r1, outC1:(c1+dir+5)%5, outR2:r2, outC2:(c2+dir+5)%5 };
    } else if(rule==='col'){
      return { outR1:(r1+dir+5)%5, outC1:c1, outR2:(r2+dir+5)%5, outC2:c2 };
    } else {
      return { outR1:r1, outC1:c2, outR2:r2, outC2:c1 };
    }
  }

  var currentGrid = buildMatrix(keyInput.value);
  var currentSteps = [];

  function runCipher(){
    errorMsg.textContent='';
    var keyVal = keyInput.value.trim();
    var msgVal = msgInput.value.trim();
    if(!/[a-zA-Z]/.test(keyVal)){
      errorMsg.textContent = 'Enter a key containing at least one letter.';
      resultBox.style.display='none'; stepsTable.style.display='none';
      return;
    }
    if(!/[a-zA-Z]/.test(msgVal)){
      errorMsg.textContent = 'Enter a message containing at least one letter.';
      resultBox.style.display='none'; stepsTable.style.display='none';
      return;
    }
    currentGrid = buildMatrix(keyVal);
    var pairs = (mode==='encrypt') ? prepareForEncrypt(msgVal) : prepareForDecrypt(msgVal);
    currentSteps = pairs.map(function(p){ return processPair(currentGrid, p[0], p[1], mode); });

    var out = currentSteps.map(function(s){ return s.outA + s.outB; }).join('');
    resultLabel.textContent = (mode==='encrypt') ? 'Ciphertext' : 'Recovered plaintext';
    resultText.textContent = out.match(/.{1,5}/g).join('  ');
    resultBox.style.display='block';

    stepsBody.innerHTML='';
    currentSteps.forEach(function(s, idx){
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>'+(idx+1)+'</td>' +
                      '<td>'+s.a+s.b+'</td>' +
                      '<td>'+ruleLabel(s.rule)+'</td>' +
                      '<td>'+s.outA+s.outB+'</td>';
      tr.addEventListener('click', function(){
        Array.prototype.forEach.call(stepsBody.children, function(row){ row.classList.remove('selected'); });
        tr.classList.add('selected');
        highlightStep(idx);
      });
      stepsBody.appendChild(tr);
    });
    stepsTable.style.display = currentSteps.length ? 'table' : 'none';

    if(currentSteps.length){
      stepsBody.firstChild.classList.add('selected');
      highlightStep(0);
    } else {
      renderMatrix(currentGrid);
    }
  }

  function highlightStep(idx){
    var s = currentSteps[idx];
    var dir = (mode==='encrypt') ? 1 : -1;
    var op = outPos(currentGrid, s.rule, s.r1, s.c1, s.r2, s.c2, dir);
    renderMatrix(currentGrid, {
      r1:s.r1, c1:s.c1, r2:s.r2, c2:s.c2, rule:s.rule,
      outR1:op.outR1, outC1:op.outC1, outR2:op.outR2, outC2:op.outC2
    });
  }

  document.getElementById('runBtn').addEventListener('click', runCipher);
  document.getElementById('clearBtn').addEventListener('click', function(){
    msgInput.value=''; errorMsg.textContent='';
    resultBox.style.display='none'; stepsTable.style.display='none';
    renderMatrix(buildMatrix(keyInput.value));
  });

  var examples = [
    { key:'MONARCHY', msgE:'Instruments', msgD:'GATLMZCLRQTX' },
    { key:'PLAYFAIREXAMPLE', msgE:'Hide the gold in the tree stump', msgD:'BMODZBXDNABEKUDMUIXMMOUVIF' },
    { key:'KEYWORD', msgE:'Attack at dawn', msgD:'BEXNWZKAZBFN' }
  ];
  var exIdx = 0;
  document.getElementById('exampleBtn').addEventListener('click', function(){
    exIdx = (exIdx+1) % examples.length;
    var ex = examples[exIdx];
    keyInput.value = ex.key;
    msgInput.value = (mode==='encrypt') ? ex.msgE : ex.msgD;
    runCipher();
  });

  keyInput.addEventListener('input', function(){
    currentGrid = buildMatrix(keyInput.value);
    renderMatrix(currentGrid);
  });

  renderMatrix(currentGrid);
  runCipher();

  /* ---------- Quiz ---------- */
  // Full question bank. Each time the quiz is (re)generated, QUIZ_SIZE
  // questions are picked at random from this pool, and each question's
  // own options are shuffled too, so the quiz differs every time.
  var QUIZ_SIZE = 6;
  var quizBank = [
    {
      q: 'Playfair is a classical example of which kind of cipher?',
      options: ['Monoalphabetic substitution', 'Digraph (pairwise) substitution', 'Transposition cipher', 'Modern block cipher'],
      correct: 1,
      explain: 'Playfair encrypts two letters at a time using a 5x5 key square, making it a digraph substitution cipher.'
    },
    {
      q: 'How many cells does the Playfair key square contain, and why?',
      options: ['26, one per letter of the alphabet', '25, because I and J share a cell', '24, because Q and Z are omitted', '30, to include digits'],
      correct: 1,
      explain: 'The grid is 5x5 = 25 cells; since the alphabet has 26 letters, I and J are merged into one cell.'
    },
    {
      q: 'If a plaintext pair contains the same letter twice (e.g. "LL"), what does the classic algorithm do?',
      options: ['Leaves the pair unchanged', 'Drops one of the letters', 'Inserts an X between the repeated letters', 'Swaps the letters with the next pair'],
      correct: 2,
      explain: 'An X (sometimes Q) is inserted between repeated letters so no digraph ever pairs a letter with itself.'
    },
    {
      q: 'Two letters of a digraph fall in the same row of the key square. What is applied during encryption?',
      options: ['Each letter is replaced by the one above it', 'Each letter is replaced by the one to its right, wrapping around', 'The letters swap columns', 'The row is reversed'],
      correct: 1,
      explain: 'Same-row pairs shift right (wrapping to the start of the row); decryption shifts left instead.'
    },
    {
      q: 'Two letters of a digraph form a rectangle in the key square. What rule is applied?',
      options: ['Shift down within each column', 'Shift right within each row', 'Each letter is replaced by the one in its own row but the other letter\'s column', 'The pair is left unchanged'],
      correct: 2,
      explain: 'For a rectangle, each letter takes its own row and the other letter\'s column — and this rule is its own inverse for decryption.'
    },
    {
      q: 'Why was Playfair considered stronger than a simple monoalphabetic cipher in the 19th century?',
      options: ['It used a much longer key', 'It required a computer to break', 'Encrypting letter pairs flattens single-letter frequency patterns, resisting basic frequency analysis', 'It encrypted numbers as well as letters'],
      correct: 2,
      explain: 'Because substitution happens on pairs rather than single letters, simple letter-frequency counting is far less effective, though digraph frequency analysis can still break it.'
    },
    {
      q: 'Who is credited with inventing the Playfair cipher?',
      options: ['Lord Playfair', 'Charles Wheatstone', 'Charles Babbage', 'Alan Turing'],
      correct: 1,
      explain: 'Charles Wheatstone invented it in 1854; Lord Playfair popularised it, and the cipher was named after him.'
    },
    {
      q: 'What happens when a plaintext message has an odd number of letters?',
      options: ['The last letter is dropped', 'An X is appended to complete the final pair', 'The message is rejected', 'The last letter is duplicated'],
      correct: 1,
      explain: 'A filler letter, usually X, is appended so the final digraph has two letters.'
    },
    {
      q: 'In the row rule, what happens during decryption instead of encryption?',
      options: ['Nothing changes, the same shift is used', 'The shift direction is reversed (left instead of right)', 'The rule no longer applies', 'The row is skipped entirely'],
      correct: 1,
      explain: 'Encryption shifts right within the row; decryption shifts left to reverse it.'
    },
    {
      q: 'Which historical conflict is Playfair notably associated with?',
      options: ['The American Civil War', 'World War I and the early parts of World War II by British forces', 'The Napoleonic Wars', 'The Cold War'],
      correct: 1,
      explain: 'The British Army and Foreign Office used Playfair for tactical communications, including in WWI.'
    },
    {
      q: 'What is a key weakness of the Playfair cipher despite encrypting digraphs?',
      options: ['It cannot handle keywords longer than 5 letters', 'Digraph frequency analysis can still reveal patterns', 'It can only encrypt numbers', 'It requires a computer to compute'],
      correct: 1,
      explain: 'While single-letter frequency analysis is defeated, common digraphs (like "TH" or "ER") still appear often enough for cryptanalysis.'
    },
    {
      q: 'When building the key square, after placing the unique keyword letters, what comes next?',
      options: ['The keyword is repeated', 'The remaining alphabet letters are added in order, skipping J', 'Random letters fill the rest', 'The grid is left with blank cells'],
      correct: 1,
      explain: 'The rest of the 5x5 grid is filled with the unused letters of the alphabet in order, with J merged into I.'
    },
    {
      q: 'If the two letters of a digraph share neither a row nor a column, which rule applies?',
      options: ['Row rule', 'Column rule', 'Rectangle rule', 'No substitution occurs'],
      correct: 2,
      explain: 'This is the rectangle case: each letter is replaced by the one in its own row but the other letter\'s column.'
    },
    {
      q: 'What is the standard filler letter used when a repeated pair needs splitting, if the repeated letter is itself X?',
      options: ['X is still used', 'Q is used instead', 'Z is used instead', 'The pair is left as-is'],
      correct: 1,
      explain: 'X is the usual filler, but if the repeated letter is X, Q is used instead to avoid an identical-letter pair.'
    },
    {
      q: 'Playfair encrypts text in units of how many letters at a time?',
      options: ['One letter', 'Two letters (a digraph)', 'Three letters', 'The whole message at once'],
      correct: 1,
      explain: 'Playfair is a digraph cipher: it processes the plaintext two letters at a time.'
    }
  ];

  function shuffle(arr){
    var a = arr.slice();
    for(var i = a.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  var quizContainer = document.getElementById('quizContainer');
  var checkQuizBtn = document.getElementById('checkQuizBtn');
  var newQuizBtn = document.getElementById('newQuizBtn');
  var quizScore = document.getElementById('quizScore');
  var currentQuiz = []; // the active, randomized set of questions for this round

  function generateQuiz(){
    quizScore.classList.remove('show');
    quizScore.textContent = '';

    var size = Math.min(QUIZ_SIZE, quizBank.length);
    var picked = shuffle(quizBank).slice(0, size);

    // Shuffle each picked question's options too, tracking the new
    // position of the correct answer.
    currentQuiz = picked.map(function(item){
      var order = shuffle(item.options.map(function(_, idx){ return idx; }));
      var options = order.map(function(origIdx){ return item.options[origIdx]; });
      var correct = order.indexOf(item.correct);
      return { q: item.q, options: options, correct: correct, explain: item.explain };
    });

    quizContainer.innerHTML = '';
    currentQuiz.forEach(function(item, qi){
      var card = document.createElement('div');
      card.className = 'card quiz-card';
      var optsHtml = item.options.map(function(opt, oi){
        return '<label class="opt" data-qi="'+qi+'" data-oi="'+oi+'">' +
               '<input type="radio" name="q'+qi+'" value="'+oi+'"> <span>'+opt+'</span></label>';
      }).join('');
      card.innerHTML = '<div class="q-title">'+(qi+1)+'. '+item.q+'</div>' + optsHtml +
                        '<div class="quiz-explain" id="explain'+qi+'">'+item.explain+'</div>';
      quizContainer.appendChild(card);
    });
  }

  checkQuizBtn.addEventListener('click', function(){
    var score = 0;
    currentQuiz.forEach(function(item, qi){
      var selected = document.querySelector('input[name="q'+qi+'"]:checked');
      var opts = document.querySelectorAll('.opt[data-qi="'+qi+'"]');
      opts.forEach(function(optEl){
        optEl.classList.remove('correct','incorrect');
        var oi = parseInt(optEl.getAttribute('data-oi'),10);
        if(oi === item.correct) optEl.classList.add('correct');
        else if(selected && parseInt(selected.value,10) === oi) optEl.classList.add('incorrect');
      });
      document.getElementById('explain'+qi).classList.add('show');
      if(selected && parseInt(selected.value,10) === item.correct) score += 1;
    });
    quizScore.textContent = 'Score: ' + score + ' / ' + currentQuiz.length;
    quizScore.classList.add('show');
  });

  newQuizBtn.addEventListener('click', generateQuiz);

  generateQuiz(); // build the first randomized quiz on page load

})();