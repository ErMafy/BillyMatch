export const memePhrases = {
  loading: [
    "Caricamento dati clandestini...",
    "Consultando l'oracolo del ferro...",
    "Decriptando le scommesse segrete...",
    "Contattando il bookmaker sotterraneo...",
  ],
  welcome: [
    "⚠️ Ispezione anti-baro attiva",
    "🔍 Telecamere di sorveglianza: ON",
    "🎯 Il ferro sa chi vince, tu no.",
    "🃏 Benvenuto nella bisca più onesta d'Italia.",
    "🚨 Nessun animale è stato maltrattato. Solo portafogli.",
    "🎲 Qui si gioca duro. O almeno, ci si prova.",
  ],
  matchInsert: [
    "Risultato registrato! Il notaio conferma.",
    "Match archiviato nella cassaforte.",
    "Il ferro ha parlato! Risultato immortalato.",
    "Aggiunto al registro segreto delle scommesse.",
  ],
  betInsert: [
    "Scommessa registrata! Nessun rimborso.",
    "Il banco ringrazia per il contributo.",
    "Soldi ben spesi (forse).",
    "Registrato. Il barista annuisce.",
  ],
  empty: [
    "Nessun dato ancora. Il ferro aspetta.",
    "Vuoto come il portafoglio del perdente.",
    "Qui non c'è niente. Ancora.",
  ],
};

export function getRandomPhrase(category: keyof typeof memePhrases, seed?: number): string {
  const phrases = memePhrases[category];
  if (seed !== undefined) {
    const x = Math.sin(seed) * 10000;
    const idx = Math.floor((x - Math.floor(x)) * phrases.length);
    return phrases[idx];
  }
  return phrases[Math.floor(Math.random() * phrases.length)];
}

export function getDailyPhrase(category: keyof typeof memePhrases): string {
  const now = new Date();
  const daySeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  return getRandomPhrase(category, daySeed);
}
