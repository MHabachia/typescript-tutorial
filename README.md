# TypeScript Zero to Hero

Ein vollständiger, praxisnaher TypeScript-Kurs in 9 Modulen – von der ersten
typisierten Variablen bis zur lauffähigen, typsicheren Todo-API.

**Ziel-IDE: IntelliJ IDEA.** Alle Konfigurationen, Run-Konfigurationen und
Anleitungen in diesem Repository sind auf IntelliJ IDEA ausgelegt (Ultimate
oder Community mit Node.js-Plugin).

Jedes Modul besteht aus einem ausführlichen Kapitel (`README.md`) und
lauffähigen Beispieldateien (`beispiele/`), die du direkt in IntelliJ starten
und verändern kannst.

## 📚 Kursübersicht

| Modul | Thema | Level |
|---|---|---|
| [Modul 1](./modul-1-fundamente/README.md) | Die Fundamente | Anfänger |
| [Modul 2](./modul-2-mittelstufe/README.md) | Der nächste Schritt | Mittelstufe |
| [Modul 3](./modul-3-fortgeschritten/README.md) | Unter der Haube | Fortgeschritten |
| [Modul 4](./modul-4-profi-nodejs/README.md) | Professionalisierung & Backend | Profi / Node.js |
| [Modul 5](./modul-5-werkzeuge-workflow/README.md) | Werkzeuge & Workflow | Praxis |
| [Modul 6](./modul-6-sicherheit-auth/README.md) | Sicherheit & Authentifizierung | Profi |
| [Modul 7](./modul-7-typescript-patterns/README.md) | TypeScript & fortgeschrittene Patterns | Profi+ |
| [Modul 8](./modul-8-deployment/README.md) | Deployment & Produktion | Profi+ |
| [Modul 9](./modul-9-abschlussprojekt/README.md) | Abschlussprojekt: Typsichere Todo-API | Profi+ |

Dazu: [GLOSSAR.md](./GLOSSAR.md) – alle Fachbegriffe des Kurses auf einen Blick.

## ✅ Fortschritt

Hake ab, was du durchgearbeitet hast:

- [ ] **Modul 1 – Die Fundamente**
  - [ ] 1.1 Was TypeScript wirklich macht
  - [ ] 1.2 Variablen (`let`, `const`) & primitive Typen
  - [ ] 1.3 Type Annotation vs. Type Inference
  - [ ] 1.4 Funktionen typisieren
  - [ ] 1.5 `any`, `unknown`, `never` & `void`
- [ ] **Modul 2 – Der nächste Schritt**
  - [ ] 2.1 Arrays & Tuples
  - [ ] 2.2 Objekttypen: `interface` vs. `type`
  - [ ] 2.3 Optionale Felder, `readonly` & Index-Signaturen
  - [ ] 2.4 Klassen & Zugriffsmodifizierer
  - [ ] 2.5 Vererbung, `abstract` & Interfaces implementieren
  - [ ] 2.6 Enums – und warum Union Types meist besser sind
- [ ] **Modul 3 – Unter der Haube**
  - [ ] 3.1 Union Types
  - [ ] 3.2 Intersection Types
  - [ ] 3.3 Literal Types & `as const`
  - [ ] 3.4 Type Guards & Narrowing
  - [ ] 3.5 Discriminated Unions & Vollständigkeitsprüfung mit `never`
  - [ ] 3.6 Async/Await & Promises typsicher
- [ ] **Modul 4 – Professionalisierung & Backend**
  - [ ] 4.1 Node.js mit TypeScript einrichten
  - [ ] 4.2 Module: `export` / `import`
  - [ ] 4.3 CommonJS vs. ECMAScript-Module
  - [ ] 4.4 Projektstruktur & Barrel-Files
  - [ ] 4.5 `process.env` und Node-APIs typsicher nutzen
  - [ ] 4.6 Ein eigener HTTP-Server mit `node:http`
- [ ] **Modul 5 – Werkzeuge & Workflow**
  - [ ] 5.1 Die `tsconfig.json` verstehen
  - [ ] 5.2 Der Strict-Mode im Detail
  - [ ] 5.3 `tsc` und `ts-node`
  - [ ] 5.4 ESLint für TypeScript
  - [ ] 5.5 IntelliJ IDEA einrichten
  - [ ] 5.6 npm-Skripte als Workflow
- [ ] **Modul 6 – Sicherheit & Authentifizierung**
  - [ ] 6.1 Authentifizierung vs. Autorisierung
  - [ ] 6.2 Passwörter richtig speichern
  - [ ] 6.3 Sessions & Tokens typisieren
  - [ ] 6.4 "Parse, don't validate"
  - [ ] 6.5 Branded Types / Nominal Typing
  - [ ] 6.6 Häufige Sicherheitsfehler in TypeScript-Backends
- [ ] **Modul 7 – TypeScript & fortgeschrittene Patterns**
  - [ ] 7.1 Generics: Typen als Parameter
  - [ ] 7.2 `keyof`, Constraints & Lookup Types
  - [ ] 7.3 Die eingebauten Utility Types
  - [ ] 7.4 Eigene Utility Types: Mapped & Conditional Types
  - [ ] 7.5 Decorators
- [ ] **Modul 8 – Deployment & Produktion**
  - [ ] 8.1 Vom TypeScript zum lauffähigen JavaScript
  - [ ] 8.2 `dependencies` vs. `devDependencies`
  - [ ] 8.3 Konfiguration & Umgebungsvariablen
  - [ ] 8.4 Source Maps & Fehlersuche in Produktion
  - [ ] 8.5 Docker: Multi-Stage-Build
  - [ ] 8.6 Go-Live-Checkliste
- [ ] **Modul 9 – Abschlussprojekt**
  - [ ] 9.1 Die Anforderungen
  - [ ] 9.2 Architektur: Wer kennt wen?
  - [ ] 9.3 Die Bausteine im Einzelnen
  - [ ] 9.4 Starten & Testen
  - [ ] 9.5 Die API-Referenz
  - [ ] 9.6 Erweiterungsideen

## 🛠️ Voraussetzungen

- [Node.js](https://nodejs.org/) 18 oder neuer
- [IntelliJ IDEA](https://www.jetbrains.com/idea/) – Ultimate oder Community
  Edition. In der Community Edition zusätzlich das Plugin **"Node.js"**
  installieren (*Settings → Plugins → Marketplace*); in Ultimate ist es
  bereits enthalten.

## 🚀 Loslegen

```bash
git clone <dieses-repository>
cd typescript-tutorial
npm install
```

Danach in IntelliJ IDEA:

1. **File → Open...** und den Projektordner auswählen.
2. Beim Öffnen **Trust Project** bestätigen.
3. Unter *Settings → Languages & Frameworks → Node.js* prüfen, dass ein
   Node-Interpreter ausgewählt ist (IntelliJ erkennt ihn meist automatisch).
4. Unter *Settings → Languages & Frameworks → TypeScript* sicherstellen, dass
   der TypeScript-Service aktiviert ist und die Version aus
   `node_modules/typescript` verwendet wird.
5. Für ESLint-Hinweise im Editor: *Settings → Languages & Frameworks → Code
   Quality Tools → ESLint* auf **Automatic ESLint Configuration** stellen.

Eine ausführliche Einrichtungsanleitung steht in
[Modul 5.5](./modul-5-werkzeuge-workflow/README.md).

## ▶️ Code ausführen

**Einzelne Beispieldatei:** Datei öffnen, Rechtsklick im Editor →
*Run 'dateiname.ts'*. IntelliJ legt automatisch eine Node.js-Konfiguration an,
die die Datei über `ts-node` startet.

**Mitgelieferte Run-Konfigurationen** (erscheinen nach dem Öffnen des Projekts
oben rechts in der Symbolleiste):

| Konfiguration | Wirkung |
|---|---|
| Run All (Abschlussprojekt) | startet den Server aus Modul 9 |
| Typecheck (tsc --noEmit) | prüft das gesamte Repository auf Typfehler |
| Lint (ESLint) | prüft das gesamte Repository mit ESLint |

**Im Terminal** (*View → Tool Windows → Terminal*):

```bash
npm run modul1        # Beispiel aus Modul 1
npm run modul7        # Beispiel aus Modul 7
npm start             # Abschlussprojekt (Server auf Port 3000)

npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
npm run build         # kompiliert nach dist/
npm run start:prod    # startet die kompilierte Version ohne ts-node
```

## 📁 Repository-Struktur

```
typescript-tutorial/
├── README.md                          <- Diese Datei
├── GLOSSAR.md                         <- Alle Fachbegriffe des Kurses
├── CONTRIBUTING.md                    <- Wie du zum Kurs beitragen kannst
├── LICENSE                            <- MIT-Lizenz
├── package.json                       <- Abhängigkeiten & npm-Skripte
├── tsconfig.json                      <- Extrem strikte TypeScript-Konfiguration
├── eslint.config.js                   <- ESLint Flat Config
├── .gitignore                         <- ignoriert IntelliJ-Settings, nicht die Run-Konfigurationen
├── .idea/
│   └── runConfigurations/             <- Play-Buttons für IntelliJ (im Git!)
├── modul-1-fundamente/
│   ├── README.md
│   └── beispiele/                     <- 4 lauffähige .ts-Dateien
├── modul-2-mittelstufe/
│   ├── README.md
│   └── beispiele/
├── modul-3-fortgeschritten/
│   ├── README.md
│   └── beispiele/
├── modul-4-profi-nodejs/
│   ├── README.md
│   └── beispiele/                     <- inkl. eigener Module zum Importieren
├── modul-5-werkzeuge-workflow/
│   ├── README.md
│   └── beispiele/
├── modul-6-sicherheit-auth/
│   ├── README.md
│   └── beispiele/
├── modul-7-typescript-patterns/
│   ├── README.md
│   └── beispiele/                     <- 5 lauffähige .ts-Dateien
├── modul-8-deployment/
│   ├── README.md
│   └── beispiele/                     <- inkl. Dockerfile.beispiel
└── modul-9-abschlussprojekt/
    ├── README.md
    └── todo-app/                      <- Todo-API mit Auth, Store & Validierung
        ├── types.ts
        ├── konfiguration.ts
        ├── store.ts
        ├── validierung.ts
        ├── auth.ts
        ├── server.ts
        └── README.md
```

## 📐 Wie ein Kapitel aufgebaut ist

Jedes Modul-README folgt derselben Struktur:

- 🎯 **Lernziele** – was du danach kannst
- **Inhalt** – Sprungmarken und Übersicht der Beispieldateien
- Pro Abschnitt: **Theorie** → **Code-Beispiele** → ⚠️ **Häufiger Fehler** →
  🎯 **Übungsaufgabe** (mit aufklappbarer Lösung)
- 📋 **Zusammenfassung & Cheat-Sheet** zum Nachschlagen

Und jede Beispieldatei ist gleich aufgebaut:

1. Erklärung des Konzepts als Kommentar
2. **Anti-Pattern** – wie man es in JavaScript oder mit `any` falsch macht
3. **Best Practice** – die saubere, typsichere Lösung
4. **Profi-Tipp** am Ende der Datei

Alle Beispieldateien sind einzeln ausführbar und geben ihre Ergebnisse mit den
Präfixen `[Anti-Pattern]` und `[Best Practice]` auf der Konsole aus.

## ⚙️ Über die strikte Konfiguration

Die `tsconfig.json` dieses Kurses ist bewusst strenger als der Standard: neben
`strict: true` sind unter anderem `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noUnusedLocals` und
`noPropertyAccessFromIndexSignature` aktiv. Das ist am Anfang unbequem – und
genau der Punkt: Fast jeder dieser Schalter verhindert eine Fehlerklasse, die
sonst erst in der Produktion auffällt. Was die einzelnen Optionen bewirken,
erklärt [Modul 5.2](./modul-5-werkzeuge-workflow/README.md).

TypeScript ist dabei auf die 6.x-Reihe gepinnt: Die neue Compiler-Generation
TypeScript 7 (Neuimplementierung in Go) ist noch nicht mit `typescript-eslint`
kompatibel. Sprachlich ändert das für diesen Kurs nichts.

## 🤝 Mitmachen

Verbesserungsvorschläge, Fehlermeldungen und neue Beispiele sind willkommen –
die Konventionen dieses Kurses stehen in [CONTRIBUTING.md](./CONTRIBUTING.md).

## 📄 Lizenz

[MIT](./LICENSE)
