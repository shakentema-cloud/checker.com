# Checker.com

I didn't set out to build the best checkers platform.
I set out to build something that didn't already exist.

Every checkers site I found was the same thing — a board, some pieces, 
maybe a bad AI. You play, you leave. Nothing brings you back tomorrow. 
No one ever asked why.

I asked why.

---

## What this is

Checker.com is what chess.com never bothered to build for checkers.
Not a game. A platform.

The difference matters. A game you play once.
A platform gives you a reason to come back.

Live demo: https://checker-com.vercel.app/
GitHub: https://github.com/shakentema-cloud/checker.com

---

## What I actually built

**A full American/International engine** - diagonal movement, mandatory captures, 
chain jumps, king promotion, winner detection. And yes, **Flying Kings** are real. 
Kings step the full length of the diagonal. Zero shortcuts. If the rule exists, the engine enforces it.

**Real-Time Live Multiplayer** - Generate a 6-character room code. Send the link. 
They click it and drop directly into the match. No sign-up walls. No tedious handshakes. 
Moves sync instantly over Supabase Realtime channels. A frictionless competitive loop.

**AI Coach Dossiers** - after every game, the coach tells you what went wrong 
and why. Not engine output. Plain language. 
"You left your back row open on move 8. Here is the pattern." 
Click any past session in your Dashboard, and a cinematic review panel opens. 
Summary. Key Moments. Training Plan. Nobody else has this for checkers. Not one platform.

**AI opponent with 5 difficulty tiers** - from Apprentice to Grandmaster. 
Built on minimax with alpha-beta pruning. The hard level actually thinks.

**Move accuracy scoring** - every move you make is classified. 
Brilliant. Great. Good. Inaccuracy. Mistake. Blunder. 
Like chess.com's game review, but for checkers.

**Daily Tactics & 3-Minute Rush** - solve as many tactical positions as possible 
before time runs out. Three mistakes and it's over. Completely addictive.

**City Leaderboards** - not just global. Top 10 in Almaty. 
Top 100 in Kazakhstan. Local pride is a real thing. 

**Pro tier ($4.99/month)** - unlimited coaching, puzzle rush, 
game replay export, premium board themes. No ads ever. 
That last part is also a product decision, not just a feature.

---

## Why checkers, why now

Chess.com built a $100M+ business on chess. Their CEO said it himself — 
checkers never figured out how to combine great product with great media 
with great community. He basically described the gap and left it open.

I looked at every checkers site that exists.
247checkers. cardgames.io. Mobile apps with 2-star reviews.
The complaints were always the same - bad AI, ads after every game, 
no accounts, no progress, nothing brings you back.

The market had the game. Nobody built the product.
I built the product.

---

## Tech

- **React + Vite SPA** (Say goodbye to SSR limits, perfectly optimized for edge caching)
- **TanStack Router** for flawless client-side routing
- **Zustand** for complex board state management
- **Supabase** - Auth, Database, and Realtime WebSocket multiplayer syncing
- **Minimax + alpha-beta pruning** - Embedded AI engine
- **Vercel** - Deployment (fully compatible routing rewrites)

---

## Who this is for

Anyone who plays checkers and wanted a platform that takes them seriously.

The CIS market specifically — Kazakhstan, Russia, Ukraine — 
where *shashki* is cultural, not casual, 
and no serious platform exists in their language for their community.

That is the niche. That is the moat.

---

Built by Temirkhan Shaken, Kazakhstan · 2026

There is a lot of pressure on me right now, as I am taking Cambridge AS & A Level exams (Mathematics 9709, Physics 9702, Computer Science 9618), it is the end of term and the school year, and tomorrow my Final Week begins (final exams in each subject). I am also preparing for my math olympiad — Stemco Global Final. I just wanted to mention it. Thank you!
