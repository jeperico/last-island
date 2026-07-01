---
name: game-over-panel-component
description: Design guide for the Game Over panel — bounty reveal, victory/defeat with One Piece flair. Use when refactoring game-over-panel.tsx.
---

# Game Over Panel — Bounty Reveal

## Overview

The game over screen transforms from a plain stats table into a **bounty reveal moment** — inspired by when a character's new bounty poster is revealed in One Piece. Victory = your bounty rises. Defeat = "Sent to Davy Jones."

## Victory Layout

```
┌──────────────────────────────────────────────┐
│                                              │
│        ✨ VICTORY ✨                          │  ← Pirata One, gold text, glow animation
│                                              │
│    ┌────────────────────────────┐            │
│    │                            │            │
│    │   WANTED                   │            │  ← Your wanted poster (updated bounty)
│    │   ═══════════════════      │            │
│    │   [Your Avatar]            │            │
│    │                            │            │
│    │   Monkey D. Luffy          │            │
│    │                            │            │
│    │   ฿ 3,150,000,000         │            │  ← Bounty = score, animated counter
│    │                  (+150M)   │            │  ← Bounty increase highlight
│    │                            │            │
│    └────────────────────────────┘            │
│                                              │
│    "All enemy vessels sent to Davy Jones!"   │  ← Flavor text, Crimson Text italic
│                                              │
│    ┌──── Battle Report ────────────────┐     │
│    │  Duration:    5m 23s              │     │
│    │  Your shots:  28  (Acc: 61%)      │     │
│    │  Enemy shots: 34  (Acc: 47%)      │     │
│    │  Ships sunk:  5/5                 │     │
│    └───────────────────────────────────┘     │
│                                              │
│    vs. Roronoa Zoro                          │  ← Opponent name
│                                              │
│    [🧭 Return to Grand Line]                 │  ← Back to lobby button
│                                              │
└──────────────────────────────────────────────┘
```

## Defeat Layout

```
┌──────────────────────────────────────────────┐
│                                              │
│        💀 DEFEAT 💀                           │  ← Pirata One, crimson text
│                                              │
│    "Your fleet was sent to Davy Jones..."    │  ← Flavor text
│                                              │
│    ┌──── Battle Report ────────────────┐     │
│    │  (same stats table)               │     │
│    └───────────────────────────────────┘     │
│                                              │
│    Conquered by:                             │
│    ┌────────────────────────────┐            │
│    │  [Opponent's Wanted Poster]│            │  ← Opponent's poster shown instead
│    └────────────────────────────┘            │
│                                              │
│    [🧭 Return to Grand Line]                 │
│                                              │
└──────────────────────────────────────────────┘
```

## Implementation

### Victory Heading

```tsx
{isWinner ? (
  <div className="text-center">
    <h1 className="font-display text-5xl text-gold animate-pulse-glow">
      ✨ VICTORY ✨
    </h1>
    <p className="font-body text-ink-muted italic mt-2 text-lg">
      All enemy vessels sent to Davy Jones!
    </p>
  </div>
) : (
  <div className="text-center">
    <h1 className="font-display text-5xl text-pirate-red">
      💀 DEFEAT 💀
    </h1>
    <p className="font-body text-ink-muted italic mt-2 text-lg">
      Your fleet was sent to Davy Jones...
    </p>
  </div>
)}
```

### Bounty Reveal (Victory only)

A mini wanted poster showing the winner with their updated bounty/score:

```tsx
{isWinner && (
  <div className="mx-auto max-w-[240px] bg-parchment border-2 border-parchment-dark 
    rounded-lg shadow-lg p-5 rotate-[-0.5deg] mt-6">
    <p className="font-display text-base text-pirate-red text-center tracking-wider">
      WANTED
    </p>
    <div className="mx-auto my-3 w-16 h-16 bg-parchment-dark rounded border-2 border-ink 
      flex items-center justify-center">
      <FactionIcon faction={userFaction} className="w-10 h-10" />
    </div>
    <p className="font-heading text-center text-ink text-sm">{winnerName}</p>
    <p className="font-display text-center text-gold text-xl mt-2">
      ฿ {formatBounty(newBounty)}
    </p>
    {bountyIncrease > 0 && (
      <p className="text-center text-victory text-xs font-ui font-bold mt-1 animate-bounce-in">
        (+{formatBounty(bountyIncrease)})
      </p>
    )}
    <p className="text-center text-ink-light text-[9px] mt-2 uppercase tracking-widest">
      — Dead or Alive —
    </p>
  </div>
)}
```

### Battle Report (Stats Table)

Styled as a ship's log:

```tsx
<div className="w-full max-w-sm mx-auto bg-parchment border-2 border-parchment-dark 
  rounded-lg p-4 mt-6">
  
  <h3 className="font-heading text-sm text-ink text-center mb-3 uppercase tracking-wide">
    ⚓ Battle Report
  </h3>
  
  <div className="space-y-2 font-ui text-sm">
    <div className="flex justify-between border-b border-parchment-dark pb-1">
      <span className="text-ink-muted">Duration</span>
      <span className="font-mono text-ink">{formatDuration(durationSeconds)}</span>
    </div>
    <div className="flex justify-between border-b border-parchment-dark pb-1">
      <span className="text-ink-muted">Your shots</span>
      <span className="font-mono text-ink">{myShots} ({myAccuracy}% accuracy)</span>
    </div>
    <div className="flex justify-between border-b border-parchment-dark pb-1">
      <span className="text-ink-muted">Enemy shots</span>
      <span className="font-mono text-ink">{opponentShots} ({opponentAccuracy}%)</span>
    </div>
    <div className="flex justify-between">
      <span className="text-ink-muted">Victor</span>
      <span className="font-heading text-ink font-bold">{winnerName}</span>
    </div>
  </div>
</div>
```

### Back to Lobby Button

```tsx
<Link href="/" className="btn-primary inline-flex items-center gap-2 mt-8 text-base px-6 py-3">
  🧭 Return to Grand Line
</Link>
```

## Animations

### Victory Glow

```css
@keyframes pulse-glow {
  0%, 100% { text-shadow: 0 0 8px rgba(245,200,66,0.4); }
  50% { text-shadow: 0 0 20px rgba(245,200,66,0.8), 0 0 40px rgba(245,200,66,0.3); }
}
.animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
```

### Bounty Counter (optional enhancement)

Animate bounty number counting up from old value to new value over 1.5s using `requestAnimationFrame` or a lightweight counter library.

### Defeat Shake

```css
@keyframes defeat-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-3px); }
  40%, 80% { transform: translateX(3px); }
}
```

## Opponent Display (Defeat)

On defeat, show the opponent's info more prominently (they conquered you):

```tsx
{!isWinner && (
  <div className="text-center mt-4">
    <p className="font-ui text-sm text-ink-muted">Conquered by:</p>
    <p className="font-heading text-lg text-ink mt-1">{opponentName}</p>
  </div>
)}
```

## Full Page Wrapper

```tsx
<div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-8 
  bg-parchment-light">
  {/* Content */}
</div>
```

## Key Design Decisions

- Victory is gold-themed (treasure found), defeat is crimson (blood in the water)
- The wanted poster bounty reveal is the emotional climax — animate it
- Stats table is functional (Inter/mono), not overly themed — clarity matters for numbers
- Single "Return to Grand Line" CTA — no unnecessary options
- Opponent info is secondary on victory, primary on defeat
- Flavor text uses Crimson Text italic for a narrator/storytelling feel
