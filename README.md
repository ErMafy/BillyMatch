# 🎲 Billy-Match: Scommesse Clandestine sul Ferro

> Il sistema più clandestino d'Italia per tracciare partite e scommesse goliardiche sul calcetto (o biliardino, o qualsiasi ferro si desideri).

![Billy-Match Logo](public/brand/billy-match-logo.png)

## 🏗️ Stack Tecnologico

- **Framework**: Next.js 14 (App Router) + TypeScript
- **UI**: TailwindCSS + shadcn/ui + Framer Motion
- **Database**: Neon Postgres + Prisma ORM
- **Deploy**: Vercel-ready
- **Autenticazione**: Admin Mode con PIN (nessuna auth utente richiesta)

## 📁 Struttura Progetto

```
├── prisma/
│   ├── schema.prisma        # Schema database
│   └── seed.ts              # Seed dati iniziali
├── public/
│   └── brand/
│       └── billy-match-logo.png   # ⚠️ METTI QUI IL LOGO (2048x1117 px)
├── src/
│   ├── app/                 # App Router pages
│   │   ├── page.tsx         # Home / Dashboard
│   │   ├── admin/           # Pagina admin
│   │   ├── match/           # Gestione match
│   │   ├── scommesse/       # Gestione scommesse
│   │   ├── squadre/         # Lista e dettaglio squadre
│   │   └── api/             # API routes
│   ├── components/          # Componenti React
│   └── lib/                 # Utilities, DB, stats, etc.
├── .env.example             # Variabili d'ambiente
├── package.json
└── README.md
```

## 🖼️ Logo / Asset

**IMPORTANTE**: Il logo principale deve essere copiato in:

```
/public/brand/billy-match-logo.png
```

- **Dimensioni**: 2048 x 1117 px (PNG)
- Viene usato come:
  - Hero background/banner nella Home (con overlay scuro)
  - OpenGraph image nei metadata
  - Badge nella navbar (ritaglio CSS con object-fit)

Crea la cartella se non esiste:
```bash
mkdir -p public/brand
# Copia il tuo logo dentro
cp /path/to/tuo-logo.png public/brand/billy-match-logo.png
```

## 🚀 Setup Sviluppo

### 1. Installa dipendenze

```bash
npm install
```

### 2. Configura ambiente

Copia `.env.example` in `.env` e riempi i valori:

```bash
cp .env.example .env
```

Dovrai avere:
- Un database **Neon Postgres** (registrati su [neon.tech](https://neon.tech) — gratuito)
- Un PIN per l'admin mode (es: `1234`)
- Un segreto per i cookie (qualsiasi stringa lunga)

### 3. Genera Prisma Client e migra il DB

```bash
npx prisma generate
npx prisma db push
```

### 4. Seed del database

Crea le squadre, i giocatori e la stagione iniziale:

```bash
npm run db:seed
```

### 5. Avvia dev server

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) 🎉

## 🔧 Deploy su Vercel

### 1. Push su GitHub

```bash
git init
git add .
git commit -m "🎲 Billy-Match: prima release"
git remote add origin https://github.com/tuouser/billy-match.git
git push -u origin main
```

### 2. Importa su Vercel

1. Vai su [vercel.com](https://vercel.com)
2. "Import Project" → seleziona il repo GitHub
3. Configura le **Environment Variables**:
   - `DATABASE_URL` → la connection string Neon
   - `BILLY_ADMIN_PIN` → il tuo PIN
   - `BILLY_COOKIE_SECRET` → un segreto lungo
4. Deploy!

### 3. Dopo il deploy, seed il database

Se il database è vuoto, esegui il seed da locale puntando al DB di produzione, oppure usa Prisma Studio:

```bash
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
```

## 📖 Pagine

| Pagina | URL | Descrizione |
|--------|-----|-------------|
| Home / Dashboard | `/` | Hero, squadre, classifica, quote, ultimi match, Hall of Shame |
| Squadre | `/squadre` | Lista squadre con stats |
| Dettaglio Squadra | `/squadre/[slug]` | Roster, stats, badge, storico match |
| Match | `/match` | Inserimento e storico match con filtri |
| Scommesse | `/scommesse` | CRUD scommesse, dashboard spese, grafico |
| Admin | `/admin` | Login con PIN, reset stagione |

## 🎯 Funzionalità

### Squadre Fisse
- **CANTALPÒ CANTALUPO**: RINOGHEN, LUPO
- **LOS PELATOS**: VALDES (aka MINO), MAZZA IL CODONE DI STOP

### Match
- Modalità: **SETS** o **GOALS** con toggle
- Punteggio vincitore/perdente
- Prevenzione duplicati (checksum)
- Note opzionali

### Scommesse
- Chi paga: Vincitore / Perdente / 50-50 / Manuale
- Collegamento opzionale a un match
- Dashboard spese con saldo differenziale

### Quote Goliardiche (Home)
- **Fase 1** (< 5 match): quote casuali 1.60-2.40, deterministiche per giorno
- **Fase 2** (≥ 5 match): Laplace smoothing + margine banco 6%

### Badge & Titoli
- 🔥 **Mano Calda**: streak ≥ 3
- 😰 **Pelo sul Ferro**: vittorie 2-1 in set
- 💪 **Recuperone**: rimonte epiche
- 🤑 **Spilorcio**: chi spende meno
- 🍺 **Sponsor del Bar**: chi spende di più
- ⚡ **Inarrestabile**: max streak ≥ 5

### Extra
- **Rivalry Meter**: barra animata con livello di calore della rivalità
- **Meme Mode**: toggle con frasi goliardiche random
- **Hall of Shame**: top 5 sconfitte più nette
- **Export CSV**: match e scommesse
- **Reset Stagione**: chiudi e apri nuova (Admin Mode)

## 🔐 Admin Mode

1. Vai su `/admin`
2. Inserisci il PIN (variabile `BILLY_ADMIN_PIN`)
3. Un cookie firmato viene salvato per 7 giorni
4. Da admin puoi:
   - Inserire/eliminare match
   - Gestire scommesse
   - Aggiornare foto squadre
   - Resettare la stagione

## 📋 Script Disponibili

```bash
npm run dev          # Dev server
npm run build        # Build produzione
npm run start        # Start produzione
npm run db:push      # Push schema al DB
npm run db:migrate   # Migrate dev
npm run db:seed      # Seed database
npm run db:studio    # Prisma Studio (GUI)
```

## ⚠️ Disclaimer

Questo progetto è puramente **goliardico**. Nessun valore legale, nessuna scommessa reale.
Il ferro è caldo, ma le scommesse sono per ridere. 🎲

---

*Fatto con ❤️ e un po' di follia al bar.*
