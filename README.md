# Playfair Cipher Virtual Lab

## Integration details

| Field | Value |
|---|---|
| Group | Playfair Cipher |
| Experiment ID | EXP05 |
| Experiment Name | Playfair Cipher Encryption & Decryption |
| Folder | `/experiments/playfair/` |
| Entry File | `index.html` |
| Navigation Title | Playfair Cipher |
| Short Description | Generate a 5x5 key matrix from a keyword and encrypt/decrypt messages using the Playfair digraph substitution cipher. |
| Required Libraries | None (pure HTML/CSS/JS) |
| Input | Key (keyword), Message (plaintext or ciphertext) |
| Output | Ciphertext (encryption) or recovered plaintext (decryption) |
| Expected Navigation Link | `/experiments/playfair/` |

## Folder contents

```
experiments/playfair/
├── index.html   - full lab page (header, toolbar, sidebar, content panes)
├── style.css    - styling, shared color tokens
├── script.js    - Playfair logic, UI wiring, quiz
└── README.md    - this file
```

This module is self-contained: it does not read from or modify any other
experiment's files, and can be opened directly via `index.html`.

## Algorithm summary

1. **Key matrix**: uppercase the key, merge J into I, remove duplicate
   letters, then fill a 5x5 grid with the key's unique letters followed by
   the remaining alphabet (also with J merged into I).
2. **Prepare message**: uppercase, strip non-letters, merge J into I, split
   into digraphs. If both letters of a pair are identical, insert a filler
   (`X`, or `Q` if the letter is `X`) between them. If the message has an
   odd number of letters, pad the final pair with `X`.
3. **Encrypt** each digraph:
   - Same row → shift each letter one place right (wrap around).
   - Same column → shift each letter one place down (wrap around).
   - Rectangle → keep each letter's row, swap to the other letter's column.
4. **Decrypt** reverses the row/column shift direction; the rectangle rule
   is its own inverse. Ciphertext is decrypted in plain consecutive pairs
   (no filler-insertion logic is applied on the ciphertext side).

## Verified test cases

| Key | Input | Mode | Expected output |
|---|---|---|---|
| `MONARCHY` | `INSTRUMENTS` | Encrypt | `GATLMZCLRQXA` |
| `MONARCHY` | `GATLMZCLRQXA` | Decrypt | `INSTRUMENTSX` (trailing X is the padding filler) |
| `MONARCHY` | `BALLOON` | Encrypt | `IBSUPMNA` |

These match the standard textbook Playfair example and were independently
verified with a reference Python implementation before being encoded in
`script.js`. Testers can re-check by entering the same key/message pairs
into the Simulation tab.

## Quiz

Five multiple-choice questions covering matrix construction, the I/J merge,
the row/column/rectangle rules, and filler-letter handling are built into
the **Quiz** tab (`script.js`, `quizData` array), each with an explanation
shown after answering.

## UI notes for the integration team

- Color tokens (`--header-brown`, `--accent-blue`, `--panel-blush`, etc.)
  are declared at the top of `style.css` under `:root` to match the shared
  lab shell. If the integration team supplies an updated palette, only
  those custom-property values need to change.
- The page is a self-contained shell (header, read-aloud toolbar, sidebar
  navigation, content pane) so it can run standalone. If the integration
  team instead wants to inject only the content pane into a shared shell,
  the six `<section class="pane" id="pane-...">` blocks inside
  `<main class="lab-content">` can be lifted out directly; their IDs
  (`pane-aim`, `pane-theory`, `pane-procedure`, `pane-simulation`,
  `pane-quiz`, `pane-references`) are named to match typical resource-tab
  labels.
- "Read Aloud" uses the browser's built-in Web Speech API
  (`speechSynthesis`) — no external service or key required.

## Known limitations

- Read Aloud voice selection depends on voices installed in the tester's
  browser; a female/male match is attempted by name but is not guaranteed
  on every system.
- Decryption assumes the ciphertext supplied already has an even number of
  letters (true of any ciphertext produced by this tool's own encryption).
