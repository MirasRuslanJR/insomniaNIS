# 🌱 EcoVerse — EcoChain Platform

> **NIS Hackathon 2026** | SmartCity: GreenTech / ClimateTech
>
> A peer-to-peer ecological action verification platform with real-time mapping, district challenges, and a trust-based reward system.

---

## 📌 Overview

EcoVerse consists of two interconnected products:

- **EcoChain** — a web platform where citizens document eco-actions (cleanups, tree planting, recycling), get them verified by peers, and earn EcoPoints
- **EcoVerse: The Game** — a city management simulation built in Godot where every environmental decision creates visible, cascading consequences

---

## ✨ Features

### EcoChain Platform
- 📸 **Document Actions** — upload before/after photos of eco-actions
- ✅ **Peer Verification** — 3 independent users verify each action; auto-approved at 2+ confirmations
- 🗺️ **Live Map** — real-time Leaflet.js map showing verified actions across cities
- 🏆 **District Challenges** — time-based competitions between cities with rewards
- 👤 **Trust Score** — reputation system; honest verifiers gain influence
- 📊 **Personal Dashboard** — track CO₂ saved, EcoPoints, badges, and streaks

### EcoVerse Game
- 🏙️ Dynamic weather affected by pollution levels
- ⚡ Energy balance: coal, solar, wind, nuclear
- 🌡️ Climate events: droughts, floods, heatwaves
- 📊 Real-time CO₂, pollution, and biodiversity tracking

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Tailwind CSS |
| JavaScript | Vanilla ES6 Modules |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Map | Leaflet.js + OpenStreetMap |
| Animations | AOS (Animate on Scroll) |
| Fonts | TT Travels Next Trial |
| Game | GDScript (Godot Engine) |

> ⚠️ Firebase Storage is intentionally **not used** — photos are stored as compressed base64 in Firestore to stay on the free tier.



## 👑 Admin Setup

To create challenges, assign the `admin` role to a user in Firestore:

```
Firebase Console → Firestore → users → {uid} → Add field:
  role | string | admin
```

Find your UID at: `Firebase Console → Authentication → Users`

---

## 🌍 CO₂ Impact Calculation

| Action | CO₂ per unit | EcoPoints |
|--------|-------------|-----------|
| 🧹 Cleanup | 2 kg | 30 |
| 🌳 Tree planting | 20 kg | 50 |
| ♻️ Recycling | 1.5 kg | 20 |
| 🚲 Bike commute | 0.15 kg | 10 |
| 💧 Water saving | 0.5 kg | 15 |
| 💡 Energy saving | 3 kg | 25 |
| 📚 Education | 0 kg | 40 |
| 🌱 Other | 1 kg | 20 |

---

## ✅ Verification Flow

```
User submits action (photo BEFORE)
        ↓
User completes action (photo AFTER)
        ↓
3 other users review before/after photos
        ↓
2+ approve  →  status: "verified"  →  EcoPoints awarded
1+ reject   →  status: "rejected"
```

- Users cannot verify their own actions
- Each verifier earns +2 Trust Score for participating
- Trust Score affects leaderboard ranking

---

## 👥 Team — insomnia?

Built by students from **Nazarbayev Intellectual Schools** for NIS Hackathon 2026.

---

## 📄 License

This project was created for educational and hackathon purposes.

---

<strong>🌱 Every action matters. Start yours today.</strong>
