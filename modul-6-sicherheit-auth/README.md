# Modul 6: Sicherheit & Authentifizierung (Profi)

Typen schützen dich beim Kompilieren – Angreifer kommen zur Laufzeit. In diesem
Modul lernst du, wie du das Typsystem so einsetzt, dass es dir an genau den
Stellen hilft, an denen echte Lücken entstehen: an der Systemgrenze, bei
Passwörtern, bei Rechten und bei allem, was du nach außen zurückgibst.

## 🎯 Lernziele

Nach diesem Modul kannst du:

- Authentifizierung und Autorisierung sauber auseinanderhalten
- Rollen und Rechte als Union-Typen und Rechte-Matrix typsicher modellieren
- erklären, warum Klartext, MD5 und SHA-256 für Passwörter untauglich sind
- Passwörter mit Salt und einem langsamen Verfahren speichern und zeitkonstant prüfen
- Sessions und Tokens typisieren und ihre Ablaufzeit ernst nehmen
- nach dem Prinzip **"Parse, don't validate"** aus `unknown` sichere Typen machen
- mit **Branded Types** verhindern, dass IDs und ungeprüfte Werte verwechselt werden
- die häufigsten Sicherheitsfehler in TypeScript-Backends erkennen und vermeiden

## Inhalt

- [6.1 Authentifizierung vs. Autorisierung](#61-authentifizierung-vs-autorisierung)
- [6.2 Passwörter richtig speichern](#62-passwörter-richtig-speichern)
- [6.3 Sessions & Tokens typisieren](#63-sessions--tokens-typisieren)
- [6.4 "Parse, don't validate": Eingaben an der Systemgrenze prüfen](#64-parse-dont-validate-eingaben-an-der-systemgrenze-prüfen)
- [6.5 Branded Types / Nominal Typing](#65-branded-types--nominal-typing)
- [6.6 Häufige Sicherheitsfehler in TypeScript-Backends](#66-häufige-sicherheitsfehler-in-typescript-backends)
- [📋 Zusammenfassung & Cheat-Sheet](#-zusammenfassung--cheat-sheet)

**Lauffähige Beispiele:** [`beispiele/`](./beispiele/)

| Datei | Thema |
|---|---|
| [`01-rollen-und-rechte.ts`](./beispiele/01-rollen-und-rechte.ts) | Rollen als Union, Rechte-Matrix |
| [`02-passwort-hashing.ts`](./beispiele/02-passwort-hashing.ts) | Salt, langsamer Hash, zeitkonstanter Vergleich |
| [`03-eingaben-validieren.ts`](./beispiele/03-eingaben-validieren.ts) | Parser von `unknown` zu sicherem Typ |
| [`04-branded-types.ts`](./beispiele/04-branded-types.ts) | Nominal Typing für IDs und geprüfte Werte |

> **Hinweis zum Kursmaterial:** Alle Beispiele in diesem Modul sind
> Lehrbeispiele. Die vereinfachten Demo-Implementierungen (selbstgebautes
> Token-Format, handgeschriebene Parser, `scrypt` von Hand verdrahtet) zeigen
> das Prinzip – sie sind **nicht** für Produktivsysteme gedacht. An den
> passenden Stellen steht jeweils, welche etablierte Bibliothek du in echten
> Projekten nimmst.

---

## 6.1 Authentifizierung vs. Autorisierung

### Theorie

Zwei Wörter, die sich fast gleich schreiben und zwei völlig verschiedene Fragen
beantworten:

- **Authentifizierung** – *"Wer bist du?"* Der Ausweis am Empfang. Login,
  Passwort, Token, Fingerabdruck.
- **Autorisierung** – *"Darfst du das?"* Ob dir die Tür zum Serverraum aufgeht.
  Rollen, Rechte, Regeln.

Das eine kommt zuerst, das andere entscheidet. Wer beides vermischt, baut
irgendwann eine Prüfung ein, die zwar sicherstellt, dass jemand eingeloggt ist –
aber nicht, dass er auch darf, was er gerade tut.

Für die Modellierung gilt: **Rollen sind kein `string`.** Ein `string` erlaubt
jeden Wert der Welt, auch `"adminn"`. Ein Tippfehler in einer Rechteprüfung ist
aber kein Schönheitsfehler, er ist die Lücke. Union-Typen schließen sie:

```typescript
type Rolle = "gast" | "mitglied" | "moderator" | "admin";
type Recht = "todo:lesen" | "todo:anlegen" | "todo:loeschen" | "benutzer:verwalten";
```

Die Zuordnung "welche Rolle darf was" gehört an **eine** Stelle, nicht verstreut
in zwanzig `if`-Abfragen. `Record<Rolle, ReadonlyArray<Recht>>` ist dafür
perfekt: Es erzwingt, dass jede Rolle einen Eintrag hat. Fügst du später eine
Rolle hinzu, meckert der Compiler sofort – die vergessene Rolle kann nicht
stillschweigend "gar keine Rechte" oder schlimmer "alle Rechte" bekommen.

### Code-Beispiele

```typescript
// Die Rechte-Matrix: eine Wahrheit, an einer Stelle.
const RECHTE_MATRIX: Record<Rolle, ReadonlyArray<Recht>> = {
  gast: ["todo:lesen"],
  mitglied: ["todo:lesen", "todo:anlegen"],
  moderator: ["todo:lesen", "todo:anlegen", "todo:loeschen"],
  admin: ["todo:lesen", "todo:anlegen", "todo:loeschen", "benutzer:verwalten"],
};

interface Benutzer {
  readonly name: string;
  readonly rolle: Rolle;
}

function hatRecht(benutzer: Benutzer, recht: Recht): boolean {
  return RECHTE_MATRIX[benutzer.rolle].includes(recht);
}
```

```typescript
// Autorisierung so kapseln, dass man sie nicht vergessen KANN:
type Ergebnis<T> =
  | { readonly ok: true; readonly wert: T }
  | { readonly ok: false; readonly fehler: string };

function fuehreAus<T>(benutzer: Benutzer, recht: Recht, aktion: () => T): Ergebnis<T> {
  if (!hatRecht(benutzer, recht)) {
    return { ok: false, fehler: "Keine Berechtigung." };
  }
  return { ok: true, wert: aktion() };
}

const gustav: Benutzer = { name: "Gustav", rolle: "gast" };
const versuch = fuehreAus(gustav, "benutzer:verwalten", () => "Benutzerliste");
console.log(versuch.ok ? versuch.wert : versuch.fehler); // "Keine Berechtigung."
```

Vollständig lauffähig in [`beispiele/01-rollen-und-rechte.ts`](./beispiele/01-rollen-und-rechte.ts).

### ⚠️ Häufiger Fehler

Autorisierung nur auf **Ressourcen-Typen** zu prüfen, nicht auf die konkrete
Ressource. Ein `mitglied` darf Todos löschen – aber eben nur die **eigenen**.
Der klassische Bug:

```typescript
// Prueft, OB er loeschen darf. Nicht, WESSEN Todo.
if (hatRecht(benutzer, "todo:loeschen")) {
  loescheTodo(idAusDerUrl); // fremde ID einsetzen und fertig
}
```

Das nennt sich *Insecure Direct Object Reference*: Die URL `/todos/4711` durch
`/todos/4712` zu ersetzen, ist keine Kunst. Prüfe deshalb immer beides – das
Recht **und** die Zugehörigkeit:

```typescript
if (hatRecht(benutzer, "todo:loeschen") && todo.besitzerId === benutzer.id) { … }
```

### 🎯 Übungsaufgabe

Erweitere die Rechte-Matrix um die Rolle `"redakteur"`, die lesen und anlegen
darf, aber nicht löschen. Schreibe außerdem eine Funktion
`rechteVon(rolle: Rolle): ReadonlyArray<Recht>`. Was passiert, wenn du die neue
Rolle nur zum Union-Typ hinzufügst und die Matrix vergisst?

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
type Rolle = "gast" | "mitglied" | "redakteur" | "moderator" | "admin";

const RECHTE_MATRIX: Record<Rolle, ReadonlyArray<Recht>> = {
  gast: ["todo:lesen"],
  mitglied: ["todo:lesen", "todo:anlegen"],
  redakteur: ["todo:lesen", "todo:anlegen"],
  moderator: ["todo:lesen", "todo:anlegen", "todo:loeschen"],
  admin: ["todo:lesen", "todo:anlegen", "todo:loeschen", "benutzer:verwalten"],
};

function rechteVon(rolle: Rolle): ReadonlyArray<Recht> {
  // Sicher ohne Pruefung: "Record" mit Literal-Union-Schluesseln garantiert
  // fuer jede Rolle einen Eintrag - anders als bei einer Index-Signatur, wo
  // "noUncheckedIndexedAccess" ein "| undefined" ergaenzen wuerde.
  return RECHTE_MATRIX[rolle];
}

console.log(rechteVon("redakteur")); // [ 'todo:lesen', 'todo:anlegen' ]
```

Vergisst du den Matrix-Eintrag, meldet der Compiler:
`Property 'redakteur' is missing in type ...`. Genau das ist der Punkt: Die
Lücke wird zum Kompilierfehler, statt zu einer stillen Fehlfunktion.

</details>

---

## 6.2 Passwörter richtig speichern

### Theorie

Ein Passwort ist ein Geheimnis, das dein Server nie erfahren muss. Er muss nur
prüfen können, ob jemand es kennt. Daraus folgt alles Weitere.

**Warum Klartext katastrophal ist:** Ein einziger Datenbank-Leak öffnet nicht
nur deine Anwendung, sondern auch alle anderen Dienste, bei denen deine
Benutzer dasselbe Passwort verwenden – und das tun sie.

**Warum MD5 oder SHA-256 auch falsch sind:** Das sind Prüfsummen-Verfahren für
Dateien. Sie sind darauf optimiert, Gigabytes in Sekunden zu verarbeiten. Genau
diese Geschwindigkeit ist bei Passwörtern das Problem: Moderne Hardware
probiert Milliarden Kandidaten pro Sekunde durch. Dazu kommt: Ohne **Salt**
ergibt dasselbe Passwort bei jedem Benutzer denselben Hash. Zwei gleiche
Einträge in der Datenbank verraten also zwei gleiche Passwörter – und
vorberechnete Tabellen erledigen den Rest.

Die richtige Lösung hat drei Zutaten:

| Zutat | Was sie bewirkt |
|---|---|
| **Salt** | Zufallswert pro Benutzer, wird mitgespeichert. Kein Geheimnis – er macht jeden Hash einzigartig. |
| **Langsames Verfahren** | scrypt, bcrypt, argon2. Absichtlich rechen- und speicherintensiv. |
| **Zeitkonstanter Vergleich** | `timingSafeEqual` statt `===`. Verrät nichts über die Laufzeit. |

`===` bricht beim ersten unterschiedlichen Byte ab. Aus den winzigen
Laufzeitunterschieden lässt sich theoretisch Information gewinnen – deshalb
vergleicht man Geheimnisse in konstanter Zeit.

> **Für die Praxis:** Das Beispiel nutzt `scrypt` aus `node:crypto`, weil es
> ohne zusätzliche Abhängigkeit läuft. In echten Projekten nimmst du
> **argon2** oder **bcrypt** als gepflegte Bibliothek – oder gleich einen
> fertigen Identity-Provider. Dort sind Parameterwahl, Formatierung und
> spätere Migration schon gelöst. Passwort-Speicherung baut man nicht selbst.

### Code-Beispiele

```typescript
// So NICHT: schnell und ohne Salt.
import { createHash } from "node:crypto";

const a = createHash("sha256").update("hunter2").digest("hex");
const b = createHash("sha256").update("hunter2").digest("hex");
console.log(a === b); // true - gleiche Passwoerter sind sofort erkennbar
```

```typescript
// So schon: Salt + langsames Verfahren, Verfahren im Ergebnis vermerkt.
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SCHLUESSEL_LAENGE = 64;

function scryptAsync(passwort: string, salt: Buffer): Promise<Buffer> {
  return new Promise((aufloesen, ablehnen) => {
    scrypt(passwort, salt, SCHLUESSEL_LAENGE, (fehler, schluessel) => {
      if (fehler !== null) { ablehnen(fehler); return; }
      aufloesen(schluessel);
    });
  });
}

async function hashePasswort(passwort: string): Promise<string> {
  const salt = randomBytes(16);
  const schluessel = await scryptAsync(passwort, salt);
  return `scrypt$${salt.toString("hex")}$${schluessel.toString("hex")}`;
}
```

```typescript
// Pruefen - zeitkonstant, und defensiv gegenueber kaputten Eintraegen.
async function passwortStimmt(passwort: string, gespeichert: string): Promise<boolean> {
  const teile = gespeichert.split("$");
  const saltHex = teile[1];
  const schluesselHex = teile[2];
  // "noUncheckedIndexedAccess": Indexzugriffe sind "string | undefined".
  if (teile[0] !== "scrypt" || saltHex === undefined || schluesselHex === undefined) {
    return false;
  }
  const erwartet = Buffer.from(schluesselHex, "hex");
  if (erwartet.length !== SCHLUESSEL_LAENGE) return false;

  const berechnet = await scryptAsync(passwort, Buffer.from(saltHex, "hex"));
  return timingSafeEqual(berechnet, erwartet); // beide Puffer gleich lang!
}
```

Vollständig lauffähig in [`beispiele/02-passwort-hashing.ts`](./beispiele/02-passwort-hashing.ts).

### ⚠️ Häufiger Fehler

Zwei Klassiker auf einmal:

**1. `timingSafeEqual` mit ungleich langen Puffern.** Die Funktion wirft dann
eine Ausnahme, statt `false` zu liefern. Prüfe die Länge vorher – und lass die
Prüfung bei einem kaputten Datenbankeintrag defensiv scheitern.

**2. Die Fehlermeldung, die zu viel verrät.** Sehr verbreitet:

```typescript
if (!benutzerGefunden) return "Benutzer unbekannt.";
if (!passwortKorrekt)  return "Falsches Passwort.";
```

Damit hast du eine Auskunftsstelle gebaut, die verrät, welche E-Mail-Adressen
registriert sind. Richtig ist eine einzige Meldung für beide Fälle:
`"E-Mail oder Passwort ist falsch."` Und: Bearbeite beide Fälle möglichst
gleich lang, sonst verrät auch hier die Antwortzeit die Antwort.

### 🎯 Übungsaufgabe

Schreibe eine Funktion `passwortIstStarkGenug(passwort: string): boolean`, die
mindestens 12 Zeichen verlangt und offensichtliche Kandidaten wie `"passwort"`
oder `"123456789012"` ablehnt. Überlege dann: Warum ist eine Mindestlänge
wichtiger als die Regel "mindestens ein Sonderzeichen"?

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
const VERBOTEN: ReadonlyArray<string> = ["passwort", "password", "123456", "qwertz"];

function passwortIstStarkGenug(passwort: string): boolean {
  if (passwort.length < 12) return false;

  const klein = passwort.toLowerCase();
  if (VERBOTEN.some((eintrag) => klein.includes(eintrag))) return false;

  // Reine Ziffernfolgen sind trotz Laenge schwach.
  if (/^\d+$/.test(passwort)) return false;

  return true;
}

console.log(passwortIstStarkGenug("kurz"));                 // false
console.log(passwortIstStarkGenug("123456789012"));         // false
console.log(passwortIstStarkGenug("Mein-Passwort-2026"));   // false (enthaelt "passwort")
console.log(passwortIstStarkGenug("bunter-elch-am-fluss")); // true
```

**Warum Länge schlägt Sonderzeichen:** Jedes zusätzliche Zeichen vervielfacht
den Suchraum. Die Regel "ein Sonderzeichen" erzeugt dagegen vorhersagbare
Muster – aus `Passwort` wird `Passwort1!`, und genau das steht in jeder
Kandidatenliste ganz oben. Vier zufällige Wörter sind besser als acht
verschnörkelte Zeichen. Die aktuellen NIST-Empfehlungen gehen deshalb weg von
Komplexitätsregeln und hin zu Mindestlänge plus Abgleich mit bekannten
geleakten Passwörtern.

</details>

---

## 6.3 Sessions & Tokens typisieren

### Theorie

HTTP vergisst dich nach jeder Anfrage. Damit du nicht bei jedem Klick dein
Passwort eintippst, braucht es einen Ausweis für die Zeit danach. Zwei Wege
sind üblich:

| | **Session-Cookie** | **JWT (Token)** |
|---|---|---|
| Wo liegt der Zustand? | auf dem Server | im Token selbst |
| Was hat der Client? | eine zufällige ID | die Daten plus Signatur |
| Sofort widerrufbar? | ja – Eintrag löschen | nein, nur über Zusatzlisten |
| Gut für | klassische Web-Apps | zustandslose APIs, viele Dienste |

Die Faustregel: **Im Zweifel Session-Cookie.** Der große Vorteil ist der
Widerruf – wenn ein Konto kompromittiert ist, willst du es sofort aussperren
können, nicht erst in 15 Minuten. JWTs spielen ihre Stärke aus, wenn mehrere
Dienste denselben Ausweis prüfen müssen, ohne eine gemeinsame Datenbank zu
befragen.

Ein Cookie braucht in beiden Fällen dieselben Flags: `HttpOnly` (kein Zugriff
per JavaScript), `Secure` (nur über HTTPS), `SameSite=Lax` oder `Strict` (gegen
CSRF) und ein Ablaufdatum.

**Warum du kein eigenes Token-Format baust:** Ein Token besteht aus Daten *und*
einem kryptografischen Beweis, dass die Daten unverändert sind. Diesen Beweis
korrekt zu erzeugen und – vor allem – korrekt zu **prüfen**, ist voller
Fallstricke. Der bekannteste: eine Prüfung, die dem Token glaubt, welches
Verfahren verwendet wurde. Selbstgebautes wirkt beim Schreiben einfach und ist
beim Prüfen falsch. Nimm eine etablierte Bibliothek (`jose` für JWT) oder das
Session-Handling deines Frameworks.

Was du selbst machst, ist die **Typisierung** des Inhalts – und das gründlich:

```typescript
interface TokenInhalt {
  readonly benutzerId: string;
  readonly rolle: "mitglied" | "admin";
  readonly laeuftAbUm: number; // Unix-Zeit in Sekunden
}
```

Die **Ablaufzeit ist Pflicht, nicht Kür.** Ein Token ohne Ablauf ist ein
Generalschlüssel, den du nie zurückbekommst. Übliche Aufteilung: kurzlebiges
Access-Token (Minuten), langlebiges Refresh-Token (Tage), das serverseitig
widerrufbar ist.

### Code-Beispiele

```typescript
// Der Inhalt eines Tokens ist FREMDDATEN - auch wenn er aus deinem eigenen
// Cookie stammt. Also parsen, nicht glauben (siehe 6.4).
type Resultat<T> =
  | { readonly ok: true; readonly wert: T }
  | { readonly ok: false; readonly fehler: ReadonlyArray<string> };

function parseTokenInhalt(eingabe: unknown, jetztSekunden: number): Resultat<TokenInhalt> {
  if (typeof eingabe !== "object" || eingabe === null) {
    return { ok: false, fehler: ["Token ungueltig."] };
  }
  const objekt = eingabe as Record<string, unknown>;
  const benutzerId = objekt["benutzerId"];
  const rolle = objekt["rolle"];
  const laeuftAbUm = objekt["laeuftAbUm"];

  if (typeof benutzerId !== "string" || benutzerId.length === 0) {
    return { ok: false, fehler: ["Token ungueltig."] };
  }
  if (rolle !== "mitglied" && rolle !== "admin") {
    return { ok: false, fehler: ["Token ungueltig."] };
  }
  if (typeof laeuftAbUm !== "number") {
    return { ok: false, fehler: ["Token ungueltig."] };
  }
  if (laeuftAbUm <= jetztSekunden) {
    return { ok: false, fehler: ["Token abgelaufen."] };
  }
  return { ok: true, wert: { benutzerId, rolle, laeuftAbUm } };
}
```

```typescript
// Cookie-Optionen typisiert - so vergisst niemand ein Flag.
interface CookieOptionen {
  readonly httpOnly: true;   // Literal "true": ein "false" waere ein Fehler
  readonly secure: true;
  readonly sameSite: "lax" | "strict";
  readonly maxAgeSekunden: number;
}

const SESSION_COOKIE: CookieOptionen = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAgeSekunden: 60 * 60 * 8,
};
console.log(SESSION_COOKIE.maxAgeSekunden); // 28800
```

Der Token-Parser läuft vollständig in
[`beispiele/03-eingaben-validieren.ts`](./beispiele/03-eingaben-validieren.ts).

### ⚠️ Häufiger Fehler

Den Token-Inhalt **dekodieren** und für **geprüft** halten. Der Datenteil eines
JWT ist nur Base64 – jeder kann ihn lesen und jeder kann sich einen bauen.
Erst die Signaturprüfung macht ihn vertrauenswürdig. `decode()` ist nicht
`verify()`.

Zweiter Klassiker: **Geheimnisse im Token**. Alles, was im Payload steht, ist
für den Besitzer des Tokens lesbar. Ein Token ist kein Tresor, sondern ein
versiegelter Umschlag mit Sichtfenster.

Dritter: **`rolle` aus dem Token blind vertrauen, ohne Ablaufprüfung.** Ein
gültig signiertes Token von letztem Jahr ist immer noch gültig signiert.

### 🎯 Übungsaufgabe

Schreibe einen Typ `Sitzung` und eine Funktion
`istSitzungGueltig(sitzung: Sitzung, jetzt: Date): boolean`. Eine Sitzung ist
gültig, wenn sie nicht abgelaufen **und** nicht widerrufen ist. Modelliere den
Widerruf so, dass der Compiler dich zwingt, ihn zu berücksichtigen.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
// Discriminated Union statt eines Flags: der "widerrufen"-Fall hat einen
// Grund, der aktive Fall hat keinen. Beides zusammen gibt es nicht.
type Sitzung =
  | { readonly status: "aktiv"; readonly benutzerId: string; readonly laeuftAbUm: Date }
  | { readonly status: "widerrufen"; readonly benutzerId: string; readonly grund: string };

function istSitzungGueltig(sitzung: Sitzung, jetzt: Date): boolean {
  switch (sitzung.status) {
    case "aktiv":
      return sitzung.laeuftAbUm.getTime() > jetzt.getTime();
    case "widerrufen":
      // Hier gibt es "laeuftAbUm" gar nicht - der Compiler laesst den
      // Zugriff nicht zu. Der Fall kann also nicht uebersehen werden.
      return false;
    default: {
      const nichtErreichbar: never = sitzung;
      throw new Error(`Unbekannter Status: ${String(nichtErreichbar)}`);
    }
  }
}

const jetzt = new Date();
const aktiv: Sitzung = {
  status: "aktiv",
  benutzerId: "b-1",
  laeuftAbUm: new Date(jetzt.getTime() + 60_000),
};
const gesperrt: Sitzung = { status: "widerrufen", benutzerId: "b-1", grund: "Abmeldung" };

console.log(istSitzungGueltig(aktiv, jetzt));    // true
console.log(istSitzungGueltig(gesperrt, jetzt)); // false
```

Ein `boolean`-Feld `widerrufen: boolean` hätte man vergessen können. Die Union
lässt das nicht zu – und dank `never` im `default` fällt auch ein später
ergänzter dritter Status sofort auf.

</details>

---

## 6.4 "Parse, don't validate": Eingaben an der Systemgrenze prüfen

### Theorie

Der wichtigste Satz dieses Moduls: **Typen existieren nur beim Kompilieren.**
Alles, was zur Laufzeit hereinkommt – HTTP-Body, JSON-Datei, Formular,
Umgebungsvariable, Token-Inhalt – ist zunächst `unknown`. Der Compiler kann
darüber nichts wissen, weil die Daten erst existieren, wenn er längst fertig
ist.

Zwei Denkweisen, wie man damit umgeht:

- **validate:** *"Sind die Daten in Ordnung?"* → gibt `boolean` zurück. Der
  Wert bleibt danach vage typisiert, und jede weitere Funktion muss der
  Prüfung von vorhin vertrauen.
- **parse:** *"Mach mir daraus einen sicheren Typ."* → gibt den Typ **oder**
  einen Fehler zurück. Danach ist ungültiger Zustand nicht mehr darstellbar.

Der Unterschied ist praktisch riesig: Nach einem `parse` kannst du das Ergebnis
nicht mehr verwechseln, denn es hat einen anderen Typ als die Rohdaten. Nach
einem `validate` sieht geprüft genauso aus wie ungeprüft.

Für den Rückgabewert eignet sich ein **Result-Typ als Discriminated Union**:

```typescript
type Resultat<T> =
  | { readonly ok: true; readonly wert: T }
  | { readonly ok: false; readonly fehler: ReadonlyArray<string> };
```

Der Vorteil gegenüber einer Exception: Der Fehlerfall steht in der Signatur. Du
kannst ihn nicht übersehen, denn ohne `if (ergebnis.ok)` kommst du gar nicht an
`ergebnis.wert`.

> **Für die Praxis:** Handgeschriebene Parser zeigen das Prinzip, skalieren
> aber schlecht. Nimm eine Schema-Bibliothek wie **Zod** oder **Valibot**: Du
> schreibst das Schema einmal, bekommst die Laufzeitprüfung **und** den
> TypeScript-Typ daraus (`z.infer<typeof Schema>`) – Typ und Prüfung können so
> gar nicht auseinanderlaufen.

### Code-Beispiele

```typescript
// ANTI-PATTERN: "as" prueft nichts, es behauptet nur.
const rohdaten: any = JSON.parse('{"email": 42, "alter": "zwanzig"}');
const anmeldung = rohdaten as Registrierung;
// Der Compiler ist zufrieden. Die Daten sind Muell. Das Programm kracht
// irgendwo weiter hinten - weit weg von der Ursache.
```

```typescript
// BEST PRACTICE: unknown rein, sicherer Typ oder Fehlerliste raus.
interface Registrierung {
  readonly email: string;
  readonly alter: number;
}

function alsObjekt(wert: unknown): Record<string, unknown> | undefined {
  if (typeof wert !== "object" || wert === null || Array.isArray(wert)) return undefined;
  return wert as Record<string, unknown>;
}

function parseRegistrierung(eingabe: unknown): Resultat<Registrierung> {
  const objekt = alsObjekt(eingabe);
  if (objekt === undefined) return { ok: false, fehler: ["Erwartet wurde ein Objekt."] };

  const fehler: string[] = [];
  // "noPropertyAccessFromIndexSignature": Klammern statt Punkt.
  const email = objekt["email"];
  const alter = objekt["alter"];

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fehler.push("Feld 'email' fehlt oder hat kein gueltiges Format.");
  }
  if (typeof alter !== "number" || !Number.isInteger(alter) || alter < 0 || alter > 130) {
    fehler.push("Feld 'alter' muss eine ganze Zahl zwischen 0 und 130 sein.");
  }
  if (fehler.length > 0 || typeof email !== "string" || typeof alter !== "number") {
    return { ok: false, fehler };
  }
  return { ok: true, wert: { email, alter } }; // ab hier ist der Typ echt
}
```

```typescript
// Der Aufrufer KANN den Fehlerfall nicht vergessen:
const ergebnis = parseRegistrierung(JSON.parse('{"email":"ada@example.org","alter":36}'));
if (ergebnis.ok) {
  console.log(ergebnis.wert.email.toUpperCase()); // sicher
} else {
  console.log("Abgelehnt:", ergebnis.fehler.join(" "));
}
// ergebnis.wert ohne die Pruefung waere ein Kompilierfehler.
```

Vollständig lauffähig in [`beispiele/03-eingaben-validieren.ts`](./beispiele/03-eingaben-validieren.ts).

### ⚠️ Häufiger Fehler

`JSON.parse` liefert in TypeScript den Typ `any` – und `any` ist ansteckend.
Diese eine Zeile hebelt die Typprüfung für alles auf, was danach kommt:

```typescript
const benutzer = JSON.parse(body);        // any
const name = benutzer.profil.name;        // any - kein Schutz mehr
```

Gewöhne dir an, das Ergebnis sofort auf `unknown` festzunageln:

```typescript
const roh: unknown = JSON.parse(body);    // jetzt zwingt dich der Compiler
const benutzer = parseBenutzer(roh);      // ... hier hindurch
```

Zweiter Stolperstein: Prüfungen an mehreren Stellen zu wiederholen, statt einmal
außen zu parsen. Dann sind vier Prüfungen leicht unterschiedlich und die fünfte
fehlt genau dort, wo es zählt.

### 🎯 Übungsaufgabe

Schreibe `parseKonfiguration(eingabe: unknown)`, das ein Objekt mit `port`
(Zahl zwischen 1 und 65535) und `modus` (`"entwicklung"` oder `"produktion"`)
in einen `Resultat<Konfiguration>` überführt. Nutze es, um `process.env`
auszuwerten – dort ist alles `string | undefined`.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
interface Konfiguration {
  readonly port: number;
  readonly modus: "entwicklung" | "produktion";
}

function parseKonfiguration(eingabe: unknown): Resultat<Konfiguration> {
  const objekt = alsObjekt(eingabe);
  if (objekt === undefined) return { ok: false, fehler: ["Konfiguration fehlt."] };

  const fehler: string[] = [];

  // Umgebungsvariablen sind IMMER Text - erst umwandeln, dann pruefen.
  const portRoh = objekt["port"];
  const port = typeof portRoh === "string" ? Number(portRoh) : portRoh;
  if (typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535) {
    fehler.push("PORT muss eine ganze Zahl zwischen 1 und 65535 sein.");
  }

  const modus = objekt["modus"];
  if (modus !== "entwicklung" && modus !== "produktion") {
    fehler.push("MODUS muss 'entwicklung' oder 'produktion' sein.");
  }

  if (fehler.length > 0 || typeof port !== "number") {
    return { ok: false, fehler };
  }
  if (modus !== "entwicklung" && modus !== "produktion") {
    return { ok: false, fehler: ["MODUS ungueltig."] };
  }
  return { ok: true, wert: { port, modus } };
}

const ausUmgebung = parseKonfiguration({
  port: process.env["PORT"] ?? "3000",
  modus: process.env["MODUS"] ?? "entwicklung",
});

if (!ausUmgebung.ok) {
  // Beim Start scheitern ist besser als nach zwei Stunden Betrieb.
  throw new Error(`Konfiguration ungueltig: ${ausUmgebung.fehler.join(" ")}`);
}
console.log(ausUmgebung.wert); // { port: 3000, modus: 'entwicklung' }
```

Beachte den Zugriff `process.env["PORT"]`: `process.env` hat eine
Index-Signatur, und `noPropertyAccessFromIndexSignature` verbietet deshalb den
Punkt-Zugriff. Der Wert ist außerdem `string | undefined` – der `??`-Fallback
ist Pflicht.

</details>

---

## 6.5 Branded Types / Nominal Typing

### Theorie

TypeScript vergleicht Typen nach ihrer **Form**, nicht nach ihrem **Namen**.
Das nennt sich *strukturelles Typsystem* und ist meistens angenehm – hier ist
es gefährlich:

```typescript
type BenutzerId = string;
type TodoId = string;
```

Für den Compiler sind das drei Namen für **denselben** Typ. Ein
`loescheTodo(besitzer: BenutzerId, todo: TodoId)` lässt sich mit vertauschten
Argumenten aufrufen, ohne dass jemand meckert. Die falsche Ressource wird
angefasst – und das ist eine echte Klasse von Sicherheitslücken, kein
Schönheitsfehler.

Die Lösung ist ein **Brand**: eine unsichtbare Markierung, die den Typ eindeutig
macht.

```typescript
type BenutzerId = string & { readonly __brand: "BenutzerId" };
```

Das Feld `__brand` existiert zur Laufzeit **nie**. Es lebt nur im Typsystem und
macht aus zwei formgleichen Typen zwei verschiedene. Weil niemand so einen Wert
"einfach so" erzeugen kann, brauchst du eine **Konstruktorfunktion** – und
genau dort gehört die Prüfung hin:

```typescript
function alsBenutzerId(roh: string): BenutzerId {
  if (!/^b-\d+$/.test(roh)) throw new Error("Ungueltige BenutzerId.");
  return roh as BenutzerId; // das EINE kontrollierte "as", hinter der Pruefung
}
```

Der eigentliche Gewinn liegt nicht bei IDs, sondern bei **"bereits geprüft"**.
Ein Typ `SichereEmail` transportiert das Wissen "diese Zeichenkette ist durch
die Validierung gelaufen" durch das ganze Programm. Eine Funktion, die eine
`SichereEmail` verlangt, kann gar nicht mehr mit ungeprüftem Text aufgerufen
werden. Du musst dem Aufrufer nicht vertrauen – der Compiler weiß es.

### Code-Beispiele

```typescript
// ANTI-PATTERN: Typ-Aliase sind kein Schutz.
type BenutzerIdFalsch = string;
type TodoIdFalsch = string;

function loescheTodoFalsch(_besitzer: BenutzerIdFalsch, todo: TodoIdFalsch): string {
  return `geloescht: ${todo}`;
}
console.log(loescheTodoFalsch("t-7", "b-42")); // vertauscht - kompiliert trotzdem
```

```typescript
// BEST PRACTICE: Brands machen die Verwechslung unmoeglich.
type BenutzerId = string & { readonly __brand: "BenutzerId" };
type TodoId = string & { readonly __brand: "TodoId" };

function alsTodoId(roh: string): TodoId {
  if (!/^t-\d+$/.test(roh)) throw new Error("Ungueltige TodoId.");
  return roh as TodoId;
}

function loescheTodo(besitzer: BenutzerId, todo: TodoId): string {
  return `Benutzer ${besitzer} loescht Todo ${todo}`;
}

const benutzerId = alsBenutzerId("b-42");
const todoId = alsTodoId("t-7");
console.log(loescheTodo(benutzerId, todoId));
// loescheTodo(todoId, benutzerId);
//   Fehler: Type '"TodoId"' is not assignable to type '"BenutzerId"'.
console.log(typeof benutzerId); // "string" - zur Laufzeit ganz normaler Text
```

```typescript
// Der wahre Nutzen: "schon geprueft" im Typ festhalten.
type SichereEmail = string & { readonly __brand: "SichereEmail" };

function alsSichereEmail(roh: string): SichereEmail | undefined {
  const getrimmt = roh.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(getrimmt) || getrimmt.length > 254) {
    return undefined;
  }
  return getrimmt as SichereEmail;
}

function versendeWillkommensmail(empfaenger: SichereEmail): string {
  return `Mail an ${empfaenger} in die Warteschlange gelegt`;
}
// versendeWillkommensmail("beliebiger text");
//   Fehler: Property '__brand' is missing in type 'string'.
```

Vollständig lauffähig in [`beispiele/04-branded-types.ts`](./beispiele/04-branded-types.ts).

### ⚠️ Häufiger Fehler

Den Brand außerhalb der Konstruktorfunktion zu vergeben:

```typescript
// Irgendwo tief im Code, weil "der Compiler nervt":
const id = eingabeAusDemFormular as BenutzerId; // Garantie futsch
```

Ein Brand ist nur so stark wie die Disziplin, ihn ausschließlich hinter der
Prüfung zu vergeben. Praktische Gegenmaßnahme: Brand-Typ und Konstruktor in
**einer** Datei halten, nur den Konstruktor exportieren – und die ESLint-Regel
`@typescript-eslint/consistent-type-assertions` einschalten, damit ein
verstreutes `as` auffällt.

Zweiter Fehler: den Brand mit `interface` und echten Feldern nachzubauen. Dann
existiert das Feld zur Laufzeit tatsächlich, wandert in `JSON.stringify` und
landet in deiner API-Antwort. Der Brand gehört in eine reine Typebene.

### 🎯 Übungsaufgabe

Baue einen Branded Type `PositiveZahl` mit einer Konstruktorfunktion, die
`undefined` zurückgibt, wenn der Wert nicht positiv ist. Schreibe eine Funktion
`teile(zaehler: number, nenner: PositiveZahl): number` – und erkläre, was diese
Signatur über den Division-durch-Null-Fehler aussagt.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
type PositiveZahl = number & { readonly __brand: "PositiveZahl" };

function alsPositiveZahl(roh: number): PositiveZahl | undefined {
  if (!Number.isFinite(roh) || roh <= 0) return undefined;
  return roh as PositiveZahl;
}

// Diese Funktion braucht KEINE Pruefung auf 0 - der Typ garantiert sie schon.
function teile(zaehler: number, nenner: PositiveZahl): number {
  return zaehler / nenner;
}

const nenner = alsPositiveZahl(4);
console.log(nenner === undefined ? "ungueltig" : teile(10, nenner)); // 2.5

const kaputt = alsPositiveZahl(0);
console.log(kaputt === undefined ? "ungueltig" : teile(10, kaputt)); // "ungueltig"
```

Die Signatur sagt: *"Division durch Null kann hier nicht passieren."* Die
Prüfung wurde vom Ort der Verwendung (wo man sie vergisst) an die Systemgrenze
verschoben (wo man sie einmal richtig macht). Genau das meint
"Parse, don't validate" auf Typebene – die beiden Abschnitte 6.4 und 6.5 sind
zwei Hälften derselben Idee.

</details>

---

## 6.6 Häufige Sicherheitsfehler in TypeScript-Backends

### Theorie

Fünf Fehler, die in fast jedem Code-Review auftauchen:

**1. `as` auf Fremddaten.** Eine Type Assertion prüft nichts, sie schaltet den
Compiler ab. `daten as Benutzer` heißt "vertrau mir" – und der Compiler
vertraut. Fremddaten gehören durch einen Parser (6.4), nicht durch ein `as`.

**2. Geheimnisse im Code.** Ein API-Schlüssel im Quelltext landet im
Git-Verlauf, und der ist für immer. Auch ein späterer Commit, der ihn entfernt,
löscht ihn nicht – er steht weiterhin in der Historie. Geheimnisse kommen aus
Umgebungsvariablen oder einem Secret-Manager, und `.env` gehört in `.gitignore`.

**3. Zu viel im API-Response.** Der häufigste Datenleak ist kein Angriff,
sondern ein `res.json(benutzer)` mit dem kompletten Datenbankobjekt – inklusive
`passwortHash`, interner ID und E-Mail-Adresse. `Omit<Benutzer, "passwortHash">`
macht daraus einen Typ, der das Feld gar nicht mehr enthalten kann.

**4. Fehlermeldungen, die zu viel verraten.** Ein Stacktrace im HTTP-Response
verrät Dateipfade, Bibliotheksversionen und manchmal SQL-Fragmente. Nach außen
gehört eine knappe, allgemeine Meldung; die Details gehören ins serverseitige
Log.

**5. Autorisierung nur im Frontend.** Einen Button auszublenden ist Komfort,
kein Schutz. Der Endpunkt ist trotzdem erreichbar – mit `curl`, in zwei
Sekunden. **Jede** Prüfung muss serverseitig noch einmal stattfinden.

### Code-Beispiele

```typescript
// 3) Was nach aussen geht, gehoert typisiert - nicht "was gerade im Objekt ist".
interface Benutzer {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly passwortHash: string;
  readonly istGesperrt: boolean;
}

// "Omit" entfernt Felder aus einem Typ. Der Response-Typ kann den Hash
// dadurch gar nicht mehr enthalten - auch nicht versehentlich.
type OeffentlicherBenutzer = Omit<Benutzer, "passwortHash" | "istGesperrt">;

function fuerApi(benutzer: Benutzer): OeffentlicherBenutzer {
  // Explizit aufbauen statt "{ ...benutzer }" - beim Spread wandern neue
  // Felder automatisch mit nach draussen, sobald jemand das Modell erweitert.
  return { id: benutzer.id, email: benutzer.email, name: benutzer.name };
}
```

```typescript
// 4) Zwei Ebenen: eine Meldung nach aussen, die Details ins Log.
function behandleFehler(fehler: unknown): { readonly nachricht: string } {
  // "useUnknownInCatchVariables": "fehler" ist unknown, also erst pruefen.
  const details = fehler instanceof Error ? fehler.stack ?? fehler.message : String(fehler);
  console.error("[intern]", details);        // nur ins Server-Log
  return { nachricht: "Es ist ein Fehler aufgetreten." }; // nur das nach aussen
}
```

```typescript
// 2) Geheimnisse aus der Umgebung - und beim Start scheitern, nicht spaeter.
function geheimnisAusUmgebung(name: string): string {
  const wert = process.env[name]; // Index-Signatur: Klammern, Ergebnis "| undefined"
  if (wert === undefined || wert.length === 0) {
    // Der Name der Variablen ist ok - ihr Wert darf nie in eine Meldung.
    throw new Error(`Umgebungsvariable ${name} fehlt.`);
  }
  return wert;
}
```

### ⚠️ Häufiger Fehler

Der teuerste der fünf ist Nummer 3, weil er so harmlos aussieht:

```typescript
const benutzer = await datenbank.findeBenutzer(id);
res.json(benutzer); // schickt ALLES - auch passwortHash
```

Das fällt in keinem Test auf, weil die Anwendung ja korrekt funktioniert. Es
fällt erst auf, wenn jemand in die Netzwerk-Konsole seines Browsers schaut.
Definiere deshalb **immer** einen expliziten Response-Typ und baue ihn Feld für
Feld auf. Und hüte dich vor `{ ...benutzer, passwortHash: undefined }`: Das
Feld ist dann zwar leer, aber immer noch da – und unter
`exactOptionalPropertyTypes` beschwert sich der Compiler zusätzlich zu Recht.

### 🎯 Übungsaufgabe

Gegeben ist der `Benutzer`-Typ von oben. Schreibe eine Funktion
`alsProfilAntwort`, die nur `id` und `name` nach außen gibt, plus ein
berechnetes Feld `initialen`. Der Rückgabetyp soll so gebaut sein, dass ein
versehentlich mitgeschicktes Feld ein Kompilierfehler ist.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
// "Pick" waehlt gezielt aus - die Umkehrung von "Omit". Bei Antworttypen ist
// "Pick" die sicherere Wahl: neue Felder im Modell wandern NICHT automatisch
// mit nach draussen, weil du sie hier aktiv aufzaehlen musst.
type ProfilAntwort = Pick<Benutzer, "id" | "name"> & { readonly initialen: string };

function alsProfilAntwort(benutzer: Benutzer): ProfilAntwort {
  const initialen = benutzer.name
    .split(" ")
    .map((teil) => teil.charAt(0).toUpperCase())
    .join("");

  return { id: benutzer.id, name: benutzer.name, initialen };
  // return { ...benutzer, initialen };
  //   Fehler: Object literal may only specify known properties -
  //   "passwortHash" gehoert nicht in "ProfilAntwort".
}

const ada: Benutzer = {
  id: "b-1",
  email: "ada@example.org",
  name: "Ada Lovelace",
  passwortHash: "scrypt$…",
  istGesperrt: false,
};

console.log(alsProfilAntwort(ada));
// { id: 'b-1', name: 'Ada Lovelace', initialen: 'AL' }
```

Der Trick ist die *excess property check* bei Objektliteralen: Sobald du den
Rückgabetyp hinschreibst, meldet der Compiler jedes Feld zu viel. Ohne
annotierten Rückgabetyp hättest du diesen Schutz nicht – ein weiterer Grund,
Signaturen öffentlicher Funktionen immer auszuschreiben.

</details>

---

## 📋 Zusammenfassung & Cheat-Sheet

```typescript
// --- Authentifizierung vs. Autorisierung -----------------------------------
// "Wer bist du?" (Login)  vs.  "Darfst du das?" (Rechte)
type Rolle = "gast" | "mitglied" | "admin";        // Union statt string
type Recht = "todo:lesen" | "todo:loeschen";
const MATRIX: Record<Rolle, ReadonlyArray<Recht>> = { … }; // jede Rolle Pflicht

// --- Passwoerter -----------------------------------------------------------
// NIE: Klartext, MD5, SHA-256 (zu schnell, ohne Salt)
// JA:  argon2 / bcrypt / scrypt - Salt pro Benutzer, Verfahren mitspeichern
const gespeichert = `scrypt$${salt.toString("hex")}$${schluessel.toString("hex")}`;
timingSafeEqual(berechnet, erwartet); // zeitkonstant, gleiche Laenge noetig!

// --- Sessions & Tokens -----------------------------------------------------
// Session-Cookie: Zustand am Server, sofort widerrufbar  -> Standardwahl
// JWT:            Zustand im Token, zustandslos          -> verteilte APIs
// Cookie immer: HttpOnly + Secure + SameSite + Ablauf
// Token-Format NIE selbst bauen (jose / Framework nehmen). Ablauf ist Pflicht.

// --- Parse, don't validate -------------------------------------------------
const roh: unknown = JSON.parse(body);   // niemals "any" stehenlassen
type Resultat<T> =
  | { readonly ok: true; readonly wert: T }
  | { readonly ok: false; readonly fehler: ReadonlyArray<string> };
// In der Praxis: Zod / Valibot - ein Schema, daraus Typ UND Laufzeitpruefung

// --- Branded Types ---------------------------------------------------------
type BenutzerId = string & { readonly __brand: "BenutzerId" };
function alsBenutzerId(roh: string): BenutzerId { /* pruefen */ return roh as BenutzerId; }
// Auch fuer "schon geprueft": SichereEmail, PositiveZahl, …

// --- Nach aussen -----------------------------------------------------------
type OeffentlicherBenutzer = Omit<Benutzer, "passwortHash">;  // oder Pick<…>
// Fehlermeldung nach aussen knapp, Details nur ins Server-Log.
// Autorisierung IMMER serverseitig - das Frontend blendet nur Knoepfe aus.
```

| Frage | Antwort |
|---|---|
| Authentifizierung oder Autorisierung? | "Wer bist du?" = Authentifizierung. "Darfst du das?" = Autorisierung. |
| Rollen als `string`? | Nein. Union-Typ – sonst ist ein Tippfehler eine Lücke. |
| Wo liegt die Rechteprüfung? | An einer Stelle (Matrix + `hatRecht`), und immer serverseitig. |
| SHA-256 für Passwörter? | Nein, viel zu schnell und ohne Salt. argon2/bcrypt/scrypt. |
| Wozu ein Salt? | Damit gleiche Passwörter verschiedene Hashes ergeben. Kein Geheimnis. |
| `===` für Hash-Vergleich? | Nein, `timingSafeEqual` – gleiche Länge vorher prüfen. |
| Session-Cookie oder JWT? | Im Zweifel Session-Cookie: sofort widerrufbar. |
| Eigenes Token-Format? | Nie. Bibliothek nehmen. `decode()` ist nicht `verify()`. |
| `JSON.parse`-Ergebnis? | Sofort auf `unknown` festnageln, dann parsen. Nie `any`. |
| `as` auf Fremddaten? | Nie. `as` prüft nichts, es behauptet nur. |
| `type Id = string` als eigener Typ? | Nein, nur ein zweiter Name. Brand nutzen. |
| Was gehört in die API-Antwort? | Nur explizit aufgezählte Felder – `Pick`/`Omit`, kein Spread. |
| Was gehört in die Fehlermeldung? | Nach außen: nichts Konkretes. Ins Log: alles. |

---

← [Kursübersicht](../README.md) | [Modul 5: Werkzeuge & Workflow](../modul-5-werkzeuge-workflow/README.md) | [Modul 7: TypeScript Patterns](../modul-7-typescript-patterns/README.md) →
