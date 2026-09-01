# todo-app – Das Abschlussprojekt

Eine typsichere Todo-API mit Anmeldung, Rollen und Eingabeprüfung, gebaut nur
mit Node-Bordmitteln. Die ausführliche Erklärung steht im
[Kapitel zu Modul 9](../README.md) – diese Datei ist die Kurzreferenz.

## Dateien

| Datei | Aufgabe |
|---|---|
| `types.ts` | Kerntypen, Branded IDs, DTOs, `Ergebnis<T>` |
| `konfiguration.ts` | Umgebungsvariablen prüfen (Fail-Fast beim Start) |
| `store.ts` | Generischer In-Memory-Speicher (Repository Pattern) |
| `validierung.ts` | Wandelt `unknown` in vertrauenswürdige Typen |
| `auth.ts` | Passwort-Hashing (scrypt), signierte Tokens, Rollen |
| `server.ts` | HTTP-Routen, Fehlerbehandlung, Graceful Shutdown |

Abhängigkeiten zeigen nur nach innen: `types.ts` importiert nichts,
`server.ts` wird von niemandem importiert.

## Starten

In IntelliJ IDEA: Play-Button **"Run All (Abschlussprojekt)"**, oder im
Terminal aus dem Projekt-Root:

```bash
npm start                              # http://localhost:3000
PORT=4000 TOKEN_GUELTIGKEIT_MINUTEN=15 npm start
```

Jede Datei lässt sich auch einzeln ausführen (Rechtsklick → *Run* in IntelliJ,
oder per Terminal) – dann läuft nur ihre eigene Demo:

```bash
npx ts-node modul-9-abschlussprojekt/todo-app/types.ts
npx ts-node modul-9-abschlussprojekt/todo-app/konfiguration.ts
npx ts-node modul-9-abschlussprojekt/todo-app/store.ts
npx ts-node modul-9-abschlussprojekt/todo-app/validierung.ts
npx ts-node modul-9-abschlussprojekt/todo-app/auth.ts
```

## Umgebungsvariablen

| Variable | Standard | Bedeutung |
|---|---|---|
| `PORT` | `3000` | Port des Servers |
| `HOSTNAME` | `localhost` | Netzwerkschnittstelle |
| `TOKEN_GUELTIGKEIT_MINUTEN` | `60` | Lebensdauer eines Tokens |
| `TOKEN_GEHEIMNIS` | Zufallswert | Schlüssel zum Signieren der Tokens |

In Produktion wäre `TOKEN_GEHEIMNIS` eine Pflichtvariable ohne Standardwert –
für dieses Lernprojekt wird ersatzweise ein Zufallswert erzeugt, damit der
Server ohne Einrichtung startet. Nach jedem Neustart sind damit alle alten
Tokens ungültig.

## Demo-Zugänge

| Benutzername | Passwort | Rolle |
|---|---|---|
| `admin` | `admin123` | `admin` – sieht und ändert alle Todos |
| `gast` | `gast123` | `user` – sieht und ändert nur eigene Todos |

## API

| Methode | Pfad | Anmeldung | Beschreibung |
|---|---|---|---|
| `GET` | `/health` | nein | Statusanzeige |
| `POST` | `/login` | nein | Anmeldung, liefert Token |
| `GET` | `/todos` | ja | eigene Todos (Admin: alle) |
| `POST` | `/todos` | ja | neues Todo anlegen |
| `PATCH` | `/todos/:id` | ja | Todo ändern |
| `DELETE` | `/todos/:id` | ja | Todo löschen |

Alle Feldnamen sind deutsch: `benutzername`, `passwort`, `titel`, `erledigt`.

## Schnelltest mit curl

```bash
# Anmelden und Token merken
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"benutzername":"admin","passwort":"admin123"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# Todos abrufen
curl -s http://localhost:3000/todos -H "Authorization: Bearer $TOKEN"

# Neues Todo anlegen
curl -s -X POST http://localhost:3000/todos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"titel":"Abschlussprojekt verstehen"}'

# Todo als erledigt markieren (ID aus der vorherigen Antwort einsetzen)
curl -s -X PATCH http://localhost:3000/todos/DEINE-TODO-ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"erledigt":true}'
```

## Sicherheitshinweis

Dies ist Lehrcode. Die Verfahren sind bewusst die richtigen (scrypt mit Salt,
HMAC-signierte Tokens mit Ablaufzeit, `timingSafeEqual`), das Format der
Tokens ist aber selbstgebaut. Für Produktivsysteme nimmst du etablierte
Bibliotheken: `argon2` oder `bcrypt` für Passwörter, `jose` für JWTs, und
`zod` oder `valibot` für die Eingabeprüfung. Das Prinzip bleibt identisch.

---

← [Modul 9: Abschlussprojekt](../README.md) | [Kursübersicht](../../README.md)
