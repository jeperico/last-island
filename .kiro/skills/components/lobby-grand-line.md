---
name: lobby-grand-line-component
description: Design guide for the Lobby page (Grand Line). Use when refactoring page.tsx (home) to apply wanted-poster game cards, sea chart styling, and One Piece navigation theming.
---

# Lobby — The Grand Line

## Overview

The lobby is the **Grand Line** — where pirates and marines find their next battle. The page transforms from a plain list into a sea chart bulletin board with wanted-poster game cards and themed navigation.

## Page Layout

```
┌──────────────────────────────────────────────────┐
│  ⚓ LAST ISLAND                   [Luffy] [🚪]  │  ← Header: logo + user badge + logout
├──────────────────────────────────────────────────┤
│                                                  │
│  ╔══════════════════════════════════╗            │
│  ║  SET SAIL                       ║            │  ← Create game CTA (big gold button)
│  ║  [⚔️ Start a New Battle]        ║            │
│  ╚══════════════════════════════════╝            │
│                                                  │
│  ┌─── JOIN BY LOG POSE ─────────────────────┐   │
│  │  [Enter game token...]  [Navigate →]     │   │  ← Join by token (Log Pose themed)
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ── GRAND LINE — Open Battles ──────────────    │  ← Section divider with rope/anchor
│                                                  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │WANTED│  │WANTED│  │WANTED│  │WANTED│       │  ← Wanted poster game cards
│  │      │  │      │  │      │  │      │       │
│  │Luffy │  │Zoro  │  │Nami  │  │Sanji │       │
│  │      │  │      │  │      │  │      │       │
│  │[Join]│  │[Join]│  │[Join]│  │[Join]│       │
│  └──────┘  └──────┘  └──────┘  └──────┘       │
│                                                  │
│  ─── [◀ Prev]  Page 1 of 3  [Next ▶] ───       │  ← Pagination
│                                                  │
└──────────────────────────────────────────────────┘
```

## Wanted Poster — Game Card

Each open game appears as a mini wanted poster:

```tsx
<article className="relative bg-parchment border-2 border-parchment-dark rounded-lg 
  shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200
  rotate-[0.3deg] hover:rotate-0 p-4 w-64">
  
  {/* "WANTED" stamp header */}
  <p className="font-display text-lg text-pirate-red text-center tracking-wider">
    WANTED
  </p>
  
  {/* Player avatar placeholder */}
  <div className="mx-auto my-2 w-20 h-20 bg-parchment-dark rounded border-2 border-ink 
    flex items-center justify-center">
    {/* Jolly Roger or Marine cap icon based on faction */}
    <JollyRogerIcon className="w-12 h-12 text-ink-muted" />
  </div>
  
  {/* Player name */}
  <p className="font-heading text-center text-ink text-base">
    {game.bluePlayerName}
  </p>
  
  {/* Token as bounty */}
  <p className="font-mono text-center text-ink-muted text-xs mt-1">
    Token: {game.token}
  </p>
  
  {/* Created timestamp */}
  <p className="text-center text-ink-light text-xs mt-1 italic">
    {formatTimeAgo(game.createdAt)}
  </p>
  
  {/* Join button */}
  <button className="mt-3 w-full btn-primary text-sm">
    ⚔️ Challenge
  </button>
  
  {/* DEAD OR ALIVE footer */}
  <p className="text-center text-ink-muted text-[10px] mt-2 uppercase tracking-widest">
    — Awaiting Challenger —
  </p>
</article>
```

### Random Rotation

Each card gets a slight random rotation for the "pinned to board" feel:

```tsx
const rotations = ["-0.5deg", "0.3deg", "-0.8deg", "0.6deg", "-0.2deg"];
// Apply via style={{ transform: `rotate(${rotations[index % rotations.length]})` }}
// Reset to 0 on hover for "picked up" effect
```

## Header Bar

```tsx
<header className="flex items-center justify-between px-6 py-4 
  bg-parchment border-b-2 border-parchment-dark">
  
  {/* Logo */}
  <h1 className="font-display text-2xl text-ink">
    ⚓ Last Island
  </h1>
  
  {/* User badge (bounty style) */}
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2 bg-parchment-dark/50 rounded-full px-3 py-1">
      <FactionIcon faction={user.filiation} className="w-4 h-4" />
      <span className="font-ui text-sm text-ink font-medium">{user.name}</span>
    </div>
    <button className="btn-secondary text-sm px-3 py-1">
      🚪 Logout
    </button>
  </div>
</header>
```

## "Set Sail" — Create Game CTA

A prominent gold button styled as a ship's wheel or anchor invitation:

```tsx
<section className="text-center py-6">
  <button className="btn-primary text-lg px-8 py-4 
    shadow-[0_4px_0_var(--color-gold-dim),0_6px_12px_rgba(0,0,0,0.15)]">
    ⚔️ Set Sail — Start a New Battle
  </button>
  <p className="text-ink-muted text-sm mt-2 italic font-body">
    Create a battle and wait for a challenger to join your crew
  </p>
</section>
```

## Join by Token — "Log Pose"

Themed as navigating by Log Pose (the OP compass that points to the next island):

```tsx
<section className="max-w-md mx-auto">
  <h2 className="font-heading text-heading text-ink mb-2">
    🧭 Navigate by Log Pose
  </h2>
  <div className="flex gap-2">
    <input 
      placeholder="Enter battle token..." 
      className="input flex-1 font-mono"
    />
    <button className="btn-primary">
      Navigate →
    </button>
  </div>
</section>
```

## Section Dividers

Use decorative rope-and-anchor dividers between sections:

```tsx
<div className="flex items-center gap-3 my-8">
  <div className="flex-1 h-px bg-parchment-dark" />
  <span className="text-ink-muted text-sm font-heading">⚓ Grand Line — Open Battles ⚓</span>
  <div className="flex-1 h-px bg-parchment-dark" />
</div>
```

## Empty State

When no games are available:

```tsx
<div className="text-center py-12">
  <p className="font-display text-3xl text-ink-light mb-2">🏝️</p>
  <p className="font-body text-ink-muted text-lg">
    The seas are calm... no battles found.
  </p>
  <p className="font-ui text-ink-light text-sm mt-1">
    Set sail and be the first to challenge!
  </p>
</div>
```

## Pagination

Styled as naval log page numbers:

```tsx
<nav className="flex items-center justify-center gap-4 mt-6">
  <button className="btn-secondary text-sm" disabled={page === 0}>
    ◀ Previous Waters
  </button>
  <span className="font-mono text-sm text-ink-muted">
    Chart {page + 1} of {totalPages}
  </span>
  <button className="btn-secondary text-sm" disabled={isLastPage}>
    Uncharted Waters ▶
  </button>
</nav>
```

## Color & Spacing Summary

- Page background: `bg-parchment-light`
- Cards: `bg-parchment` with `border-parchment-dark`
- Primary actions: `bg-gold` text `text-ink`
- Text hierarchy: `text-ink` (primary) → `text-ink-muted` (secondary) → `text-ink-light` (tertiary)
- Card grid: responsive `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`
