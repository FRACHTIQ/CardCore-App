# VUREX (Expo)

React-Native-App (Expo SDK 54) für Marktplatz, Merkzettel, Chat und Profil.

## Start

```bash
npm install
npx expo start
```

## Konfiguration

- **API-Basis-URL:** `src/config.js` → `API_BASE_URL` (z. B. Railway-Backend).
- **Demo-Listings:** In `__DEV__` kann bei leerer API auf Demo-Daten zurückgefallen werden (`USE_DEMO_LISTINGS_FALLBACK`).

## Struktur (Auszug)

| Pfad | Inhalt |
|------|--------|
| `App.js` | Provider, Root |
| `src/Root.js` | Boot, Navigation |
| `src/theme.js` | Farben, Stack-Optionen |
| `src/navigation/` | Auth-, Tab-, Stack-Navigatoren |
| `src/screens/` | Screens |
| `src/locales/` | i18n `de` / `en` |

## Scripts

- `npm start` – Expo Dev Server  
- `npm run android` / `ios` / `web` – jeweilige Plattform
