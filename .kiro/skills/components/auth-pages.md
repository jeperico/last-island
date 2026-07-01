---
name: auth-pages-component
description: Design guide for Register and Login pages themed as pirate recruitment / marine enrollment. Use when refactoring (auth)/register/page.tsx and (auth)/login/page.tsx.
---

# Auth Pages — Pirate Recruitment & Marine Enrollment

## Overview

Authentication pages are the player's entry into the world. They're themed as **recruitment posters**:
- **Register** = "Join a Crew" — choosing your filiation (Pirate or Marine)
- **Login** = "Report for Duty" — returning to the Grand Line

## Register Page — "Join a Crew"

### Layout

```
┌────────────────────────────────────────────────┐
│                                                │
│           ⚓ LAST ISLAND                       │  ← Logo centered, Pirata One
│                                                │
│    ┌────────────────────────────────────┐      │
│    │                                    │      │
│    │   JOIN A CREW                      │      │  ← Cinzel heading
│    │   ──────────────────────           │      │
│    │                                    │      │
│    │   Name: [Monkey D. Luffy      ]    │      │  ← Parchment inputs
│    │   Email: [luffy@strawhat.io   ]    │      │
│    │   Password: [••••••••         ]    │      │
│    │                                    │      │
│    │   Choose your path:                │      │
│    │   ┌─────────┐  ┌─────────────┐    │      │
│    │   │ ☠️       │  │ ⚓           │    │      │  ← Faction selector cards
│    │   │ PIRATE  │  │ MARINE      │    │      │
│    │   │         │  │             │    │      │
│    │   └─────────┘  └─────────────┘    │      │
│    │                                    │      │
│    │   [⚔️ Set Sail — Register]         │      │  ← Gold CTA
│    │                                    │      │
│    │   Already have a crew?             │      │
│    │   → Report for Duty               │      │  ← Link to login
│    │                                    │      │
│    └────────────────────────────────────┘      │
│                                                │
└────────────────────────────────────────────────┘
```

### Faction Selector

The key OP element — two side-by-side cards that let you pick your filiation:

```tsx
<fieldset className="grid grid-cols-2 gap-4 mt-4">
  <legend className="font-heading text-subheading text-ink mb-2">
    Choose your path:
  </legend>
  
  {/* Pirate option */}
  <label className={`
    relative cursor-pointer rounded-lg border-2 p-4 text-center transition-all
    ${selected === 'PIRATE' 
      ? 'border-pirate-red bg-pirate-red/5 shadow-md' 
      : 'border-parchment-dark hover:border-pirate-red/50'}
  `}>
    <input type="radio" name="filiation" value="PIRATE" className="sr-only" />
    <div className="text-3xl mb-1">☠️</div>
    <p className="font-heading text-sm font-bold text-ink">PIRATE</p>
    <p className="font-ui text-xs text-ink-muted mt-1">
      Sail free, raise your Jolly Roger
    </p>
    {selected === 'PIRATE' && (
      <div className="absolute top-2 right-2 w-5 h-5 bg-pirate-red rounded-full 
        flex items-center justify-center text-white text-xs">✓</div>
    )}
  </label>
  
  {/* Marine option */}
  <label className={`
    relative cursor-pointer rounded-lg border-2 p-4 text-center transition-all
    ${selected === 'MARINE' 
      ? 'border-marine-navy bg-marine-navy/5 shadow-md' 
      : 'border-parchment-dark hover:border-marine-navy/50'}
  `}>
    <input type="radio" name="filiation" value="MARINE" className="sr-only" />
    <div className="text-3xl mb-1">⚓</div>
    <p className="font-heading text-sm font-bold text-ink">MARINE</p>
    <p className="font-ui text-xs text-ink-muted mt-1">
      Serve Justice on the seas
    </p>
    {selected === 'MARINE' && (
      <div className="absolute top-2 right-2 w-5 h-5 bg-marine-navy rounded-full 
        flex items-center justify-center text-white text-xs">✓</div>
    )}
  </label>
</fieldset>
```

### Form Card

```tsx
<div className="w-full max-w-md mx-auto">
  <div className="bg-parchment border-2 border-parchment-dark rounded-lg 
    shadow-lg p-8">
    
    <h1 className="font-heading text-title text-ink text-center mb-1">
      Join a Crew
    </h1>
    <p className="font-body text-ink-muted text-center text-sm mb-6">
      The Grand Line awaits, recruit.
    </p>
    
    {/* Form fields */}
    <form className="space-y-4">
      <div>
        <label className="block font-ui text-sm text-ink-muted mb-1">Name</label>
        <input className="input w-full" placeholder="Your pirate name..." />
      </div>
      {/* ... email, password */}
      
      {/* Faction selector here */}
      
      <button type="submit" className="btn-primary w-full text-base py-3 mt-6">
        ⚔️ Set Sail — Register
      </button>
    </form>
    
    <p className="text-center text-sm text-ink-muted mt-4 font-body">
      Already have a crew?{" "}
      <Link href="/login" className="text-gold-dim hover:text-gold font-medium underline">
        Report for Duty →
      </Link>
    </p>
  </div>
</div>
```

## Login Page — "Report for Duty"

### Layout

Simpler — just email + password + a themed CTA:

```
┌────────────────────────────────────────────────┐
│                                                │
│           ⚓ LAST ISLAND                       │
│                                                │
│    ┌────────────────────────────────────┐      │
│    │                                    │      │
│    │   REPORT FOR DUTY                  │      │  ← Cinzel heading
│    │   ──────────────────────           │      │
│    │                                    │      │
│    │   Email: [luffy@strawhat.io   ]    │      │
│    │   Password: [••••••••         ]    │      │
│    │                                    │      │
│    │   [🧭 Navigate to Grand Line]      │      │  ← Gold CTA
│    │                                    │      │
│    │   New to the seas?                 │      │
│    │   → Join a Crew                    │      │  ← Link to register
│    │                                    │      │
│    └────────────────────────────────────┘      │
│                                                │
└────────────────────────────────────────────────┘
```

### Login Form

```tsx
<div className="w-full max-w-md mx-auto">
  <div className="bg-parchment border-2 border-parchment-dark rounded-lg shadow-lg p-8">
    
    <h1 className="font-heading text-title text-ink text-center mb-1">
      Report for Duty
    </h1>
    <p className="font-body text-ink-muted text-center text-sm mb-6">
      The Grand Line remembers its sailors.
    </p>
    
    <form className="space-y-4">
      <div>
        <label className="block font-ui text-sm text-ink-muted mb-1">Email</label>
        <input type="email" className="input w-full" placeholder="captain@crew.io" />
      </div>
      <div>
        <label className="block font-ui text-sm text-ink-muted mb-1">Password</label>
        <input type="password" className="input w-full" placeholder="••••••••" />
      </div>
      
      <button type="submit" className="btn-primary w-full text-base py-3 mt-2">
        🧭 Navigate to Grand Line
      </button>
    </form>
    
    <p className="text-center text-sm text-ink-muted mt-4 font-body">
      New to the seas?{" "}
      <Link href="/register" className="text-gold-dim hover:text-gold font-medium underline">
        Join a Crew →
      </Link>
    </p>
  </div>
</div>
```

## Auth Layout (shared wrapper)

```tsx
// (auth)/layout.tsx
export default function AuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-parchment-light flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <h1 className="font-display text-4xl text-ink mb-8">
        ⚓ Last Island
      </h1>
      
      {children}
    </main>
  );
}
```

## Error Messages — Themed

```tsx
{error && (
  <div className="flex items-start gap-2 rounded-lg border-2 border-pirate-red/30 
    bg-pirate-red/5 px-4 py-3 mt-4">
    <span className="text-pirate-red text-lg">💀</span>
    <p className="font-ui text-sm text-pirate-red">{error}</p>
  </div>
)}
```

## Key Design Decisions

- Background: full `bg-parchment-light` page, cards use `bg-parchment`
- No dark mode for auth pages — the parchment IS the identity
- Faction selector is visually prominent — it's the first major OP decision a player makes
- Form inputs use `font-body` (Crimson Text) for a handwritten feel
- Buttons are always Inter (font-ui) for clarity at small sizes
- Error messages use skull emoji + pirate-red for danger
- Links use gold for warmth (not generic blue)
