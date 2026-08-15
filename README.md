# Menuva

Menuva ist eine kostenlose Open-Source-Web-App für digitale Restaurant-Menükarten.
Restaurants registrieren sich, erstellen Kategorien, fügen Speisen und Getränke
hinzu und veröffentlichen ihre Karte über einen teilbaren Link.

## Funktionen

- Supabase E-Mail-Registrierung und Login
- Bis zu zwei eigene Restaurants pro Account mit Restaurantwechsel
- Einmalige Einladungslinks für Kollaboratoren
- Kategorien für Speisen, Getränke und mehr
- Menüeinträge erstellen, bearbeiten, löschen und als ausverkauft markieren
- Eigenschaften wie vegetarisch, vegan und scharf
- Öffentliche, mobile Menükarte mit Suche und Kategorien
- Veröffentlichungsschalter und teilbarer Link
- Row-Level-Security für Eigentümer und eingeladene Kollaboratoren
- Reiner Static Export für GitHub Pages

## 1. Supabase einrichten

1. Erstelle ein Projekt auf [supabase.com](https://supabase.com).
2. Öffne den **SQL Editor**, kopiere den Inhalt aus `supabase/schema.sql` hinein
   und führe ihn aus.
3. Kopiere `.env.example` zu `.env.local`.
4. Trage die Project URL und den **anon/public key** aus
   **Project Settings → API** ein. Verwende niemals den Service-Role-Key im
   Frontend.
5. Füge unter **Authentication → URL Configuration** deine lokale und deine
   GitHub-Pages-Adresse als Redirect URLs hinzu.

Führe danach diese idempotenten Migrationen ebenfalls im SQL Editor aus (auch
bei einem bestehenden Menuva-Projekt):

1. `supabase/media-migration.sql`
2. `supabase/multi-restaurant-collaboration-migration.sql`

## 2. Lokal starten

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ohne Supabase-Zugangsdaten funktioniert weiterhin das integrierte Beispielmenü
unter `#/m/demo`.

## 3. Auf GitHub Pages veröffentlichen

1. Lade das Projekt in ein GitHub-Repository hoch.
2. Füge in **Settings → Secrets and variables → Actions** diese Repository
   Secrets hinzu:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Wähle in **Settings → Pages → Build and deployment** die Quelle
   **GitHub Actions**.
4. Push auf `main`. Der enthaltene Workflow baut und veröffentlicht die App.

Für eine eigene Domain entfernst du im Workflow den Wert von
`NEXT_PUBLIC_BASE_PATH` und hinterlegst die Domain in GitHub Pages.

## Technik

Next.js (statischer Export), React, TypeScript, Supabase und Lucide Icons. Es ist
kein eigener Server erforderlich: GitHub Pages liefert die Oberfläche aus,
Supabase übernimmt Authentifizierung und Datenbank.
