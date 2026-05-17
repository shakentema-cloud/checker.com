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

Live demo: https://checker-com.lovable.app
GitHub: https://github.com/shakentema-cloud/checker.com

---

## What I actually built

**A full game engine** - diagonal movement, mandatory captures, 
chain jumps, king promotion, winner detection. Zero shortcuts. 
If the rule exists, the engine enforces it.

**AI opponent with 4 difficulty levels** - from 400 ELO Novice 
to 1900 ELO Master. Built on minimax with alpha-beta pruning. 
The hard level actually thinks.

**AI Coach** - after every game, it tells you what went wrong 
and why. Not engine output. Plain language. "You left your back 
row open on move 8. Here is the pattern." Nobody else has this 
for checkers. Not one platform.

**Move accuracy scoring** - every move you make is classified. 
Brilliant. Great. Good. Inaccuracy. Mistake. Blunder. 
Like chess.com's game review, but for checkers.
Which has never existed before.

**Daily Tactics** - one puzzle per day. Streak system. 
Solve it fast, climb the speed leaderboard. Miss a day, 
your streak dies. Simple hook. It works.

**3-Minute Rush** - solve as many tactical positions as possible 
before time runs out. Three mistakes and it's over. 
Our Puzzle Rush. Completely addictive.

**City Leaderboards** - not just global. Top 10 in Almaty. 
Top 100 in Kazakhstan. Local pride is a real thing. 
No other checkers platform thought about this.

**Friend Rooms** - 6-character code, share the link, 
opponent joins, game starts. Real-time. Anti-stall timer built in. 
No toxic stalling.

**6 piece color options** - Oxblood. Forest. Gold. Ivory. 
Midnight. Crimson. Choose what represents you.

**Pro tier ($4.99/month)** - unlimited coaching, puzzle rush, 
game replay export, premium board themes. No ads ever. 
That last part is also a product decision, not just a feature.

---

## Why checkers, why now

Chess.com built a $100M+ business on chess. Their CEO said it himself — 
checkers never figured out how to combine great product with great media 
with great community. He basically described the gap and left it open.

I looked at every checkers site that exists.
247checkers. cardgames.io. playcheckers.io. Mobile apps with 2-star reviews.
The complaints were always the same — bad AI, ads after every game, 
no accounts, no progress, nothing brings you back.

The market had the game. Nobody built the product.
I built the product.

---

## Tech

- Next.js 14, TypeScript, Tailwind CSS
- Zustand for game state
- Supabase - auth, database, real-time
- Socket.io - WebSocket multiplayer
- Minimax + alpha-beta pruning - AI engine
- Stripe - Pro subscription
- Vercel + Railway - deployment

---

## What this is for

nFactorial School checkers challenge, 2025.

The requirement was to build something that stands out.
Not to repeat what already exists.

Most submissions will have a board and some pieces.
This one has a coaching system, a leaderboard with city filters, 
a daily puzzle with streaks, a rush mode, a friend room system, 
a Pro subscription, and a reason for someone to come back tomorrow.

That was the goal. Not a game. A product.

---

## Who this is for

Anyone who plays checkers and wanted a platform that takes them seriously.

The CIS market specifically — Kazakhstan, Russia, Ukraine — 
where shashki is cultural, not casual, 
and no serious platform exists in their language for their community.

That is the niche. That is the moat.

---

Built by Temirkhan Shaken, Kazakhstan · 2026
