/**
 * MODUL 9 - auth.ts: Authentifizierung und Autorisierung
 * ============================================================================
 * LEHRCODE-HINWEIS: Diese Datei zeigt die KONZEPTE typsicherer Authentifizierung.
 * Sie ist bewusst schlank gehalten und ersetzt keine ausgereifte Bibliothek.
 * In echten Projekten nimmst du:
 *   - fuer Passwoerter: argon2 oder bcrypt (statt selbst mit scrypt zu bauen)
 *   - fuer Tokens: eine JWT-Bibliothek wie "jose" (statt eigenem Format)
 * Die hier verwendeten Verfahren (scrypt, HMAC, timingSafeEqual) sind dabei
 * bewusst die richtigen Bausteine - falsch waere es, MD5/SHA-256 ohne Salt
 * zu verwenden oder Passwoerter im Klartext zu speichern.
 *
 * Verwendete Konzepte aus dem Kurs:
 *   Modul 3.5 - Discriminated Unions
 *   Modul 6.1 - Rollen und Rechte
 *   Modul 6.2 - Passwort-Hashing mit Salt
 *   Modul 6.3 - Tokens mit Ablaufzeit
 */

import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { Benutzer, Ergebnis, OeffentlicherBenutzer, Rolle } from "./types";
import { alsBenutzerId, erfolg, fehlschlag } from "./types";

// -----------------------------------------------------------------------
// ANTI-PATTERN: Passwoerter im Klartext, Login ohne festes Ergebnisformat
// -----------------------------------------------------------------------
const benutzerFalsch: any = { name: "admin", passwort: "admin123" }; // Klartext!
function loginFalsch(name: any, passwort: any): any {
  if (name === benutzerFalsch.name && passwort === benutzerFalsch.passwort) {
    return { ok: true }; // mal ein Objekt ...
  }
  return null; // ... mal null: der Aufrufer kann sich auf nichts verlassen
}
console.log("[Anti-Pattern] loginFalsch:", loginFalsch("admin", "admin123"));
console.log("[Anti-Pattern] loginFalsch (falsch):", loginFalsch("admin", "x"));

// -----------------------------------------------------------------------
// BEST PRACTICE: Passwort-Hashing mit Salt (Modul 6.2)
// -----------------------------------------------------------------------
// scrypt ist absichtlich langsam und speicherintensiv. Das bremst niemanden
// beim normalen Login, macht aber massenhaftes Durchprobieren teuer.

const SCHLUESSEL_LAENGE = 32;

function scryptAsync(passwort: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(passwort, salt, SCHLUESSEL_LAENGE, (fehler, schluessel) => {
      if (fehler) {
        reject(fehler);
        return;
      }
      resolve(schluessel);
    });
  });
}

/** Erzeugt "<salt>:<hash>". Jedes Passwort bekommt sein eigenes Salt. */
export async function hashePasswort(passwort: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const schluessel = await scryptAsync(passwort, salt);
  return `${salt}:${schluessel.toString("hex")}`;
}

/**
 * Prueft ein Passwort gegen einen gespeicherten Hash.
 * timingSafeEqual vergleicht in konstanter Zeit - ein einfaches "===" wuerde
 * je nach Uebereinstimmung unterschiedlich lange brauchen und damit Hinweise
 * auf das richtige Passwort verraten (Timing-Angriff).
 */
export async function pruefePasswort(passwort: string, gespeichert: string): Promise<boolean> {
  const [salt, hash] = gespeichert.split(":");
  if (salt === undefined || hash === undefined) {
    return false;
  }
  const erwartet = Buffer.from(hash, "hex");
  const berechnet = await scryptAsync(passwort, salt);
  if (erwartet.length !== berechnet.length) {
    return false;
  }
  return timingSafeEqual(erwartet, berechnet);
}

// -----------------------------------------------------------------------
// BEST PRACTICE: Tokens mit Ablaufzeit und Signatur (Modul 6.3)
// -----------------------------------------------------------------------

export interface TokenInhalt {
  readonly benutzerId: string;
  readonly rolle: Rolle;
  /** Ablaufzeitpunkt als Unix-Zeit in Millisekunden. */
  readonly gueltigBis: number;
}

function signiere(nutzdaten: string, geheimnis: string): string {
  return createHmac("sha256", geheimnis).update(nutzdaten).digest("base64url");
}

/** Baut ein signiertes Token im Format "<nutzdaten>.<signatur>". */
export function erstelleToken(
  inhalt: TokenInhalt,
  geheimnis: string
): string {
  const nutzdaten = Buffer.from(JSON.stringify(inhalt)).toString("base64url");
  return `${nutzdaten}.${signiere(nutzdaten, geheimnis)}`;
}

/**
 * Prueft Signatur UND Ablaufzeit. Erst wenn beides stimmt, gibt es den Inhalt.
 * Das Ergebnis ist eine Discriminated Union - der Aufrufer MUSS "ok" pruefen.
 */
export function pruefeToken(token: string, geheimnis: string): Ergebnis<TokenInhalt> {
  const teile = token.split(".");
  const nutzdaten = teile[0];
  const signatur = teile[1];
  if (teile.length !== 2 || nutzdaten === undefined || signatur === undefined) {
    return fehlschlag("Token hat ein ungueltiges Format.");
  }

  const erwartet = Buffer.from(signiere(nutzdaten, geheimnis));
  const erhalten = Buffer.from(signatur);
  if (erwartet.length !== erhalten.length || !timingSafeEqual(erwartet, erhalten)) {
    return fehlschlag("Token-Signatur ist ungueltig.");
  }

  let inhalt: unknown;
  try {
    inhalt = JSON.parse(Buffer.from(nutzdaten, "base64url").toString("utf8"));
  } catch {
    return fehlschlag("Token-Inhalt ist kein gueltiges JSON.");
  }

  if (
    typeof inhalt !== "object" ||
    inhalt === null ||
    typeof (inhalt as TokenInhalt).benutzerId !== "string" ||
    typeof (inhalt as TokenInhalt).gueltigBis !== "number"
  ) {
    return fehlschlag("Token-Inhalt ist unvollstaendig.");
  }

  const geprueft = inhalt as TokenInhalt;
  if (geprueft.gueltigBis < Date.now()) {
    return fehlschlag("Token ist abgelaufen.");
  }
  return erfolg(geprueft);
}

// -----------------------------------------------------------------------
// BEST PRACTICE: Login und Rollenpruefung
// -----------------------------------------------------------------------

/** Gibt einen Benutzer ohne Passwort-Hash zurueck - explizit statt per delete. */
export function alsOeffentlich(benutzer: Benutzer): OeffentlicherBenutzer {
  return { id: benutzer.id, benutzername: benutzer.benutzername, rolle: benutzer.rolle };
}

export async function login(
  benutzername: string,
  passwort: string,
  bekannteBenutzer: readonly Benutzer[]
): Promise<Ergebnis<OeffentlicherBenutzer>> {
  const gefunden = bekannteBenutzer.find((kandidat) => kandidat.benutzername === benutzername);
  if (gefunden === undefined) {
    // Bewusst dieselbe Meldung wie bei falschem Passwort: Sonst koennte man
    // herausfinden, welche Benutzernamen existieren (siehe Modul 6.6).
    return fehlschlag("Benutzername oder Passwort ist falsch.");
  }
  const passt = await pruefePasswort(passwort, gefunden.passwortHash);
  if (!passt) {
    return fehlschlag("Benutzername oder Passwort ist falsch.");
  }
  return erfolg(alsOeffentlich(gefunden));
}

/** Rechte-Modell: "admin" darf alles, was "user" darf - aber nicht umgekehrt. */
export function darfZugreifen(rolle: Rolle, benoetigt: Rolle): boolean {
  if (benoetigt === "user") {
    return rolle === "user" || rolle === "admin";
  }
  return rolle === "admin";
}

/** Legt die Demo-Benutzer an (Passwoerter werden dabei gehasht). */
export async function erzeugeDemoBenutzer(): Promise<readonly Benutzer[]> {
  return [
    {
      id: alsBenutzerId("b-1"),
      benutzername: "admin",
      passwortHash: await hashePasswort("admin123"),
      rolle: "admin",
    },
    {
      id: alsBenutzerId("b-2"),
      benutzername: "gast",
      passwortHash: await hashePasswort("gast123"),
      rolle: "user",
    },
  ];
}

if (require.main === module) {
  const demo = async (): Promise<void> => {
    const benutzer = await erzeugeDemoBenutzer();

    const gehasht = await hashePasswort("geheim");
    console.log("[Best Practice] Hash-Format <salt>:<hash>:", `${gehasht.slice(0, 24)}...`);
    console.log("[Best Practice] Passwort korrekt:", await pruefePasswort("geheim", gehasht));
    console.log("[Best Practice] Passwort falsch:", await pruefePasswort("falsch", gehasht));

    console.log("[Best Practice] Login ok:", await login("admin", "admin123", benutzer));
    console.log("[Best Practice] Login falsch:", await login("admin", "x", benutzer));

    const geheimnis = "nur-fuer-diese-demo";
    const token = erstelleToken(
      { benutzerId: "b-1", rolle: "admin", gueltigBis: Date.now() + 60_000 },
      geheimnis
    );
    console.log("[Best Practice] Token geprueft:", pruefeToken(token, geheimnis));
    console.log("[Best Practice] Token mit falschem Schluessel:", pruefeToken(token, "anderes"));

    const abgelaufen = erstelleToken(
      { benutzerId: "b-1", rolle: "admin", gueltigBis: Date.now() - 1 },
      geheimnis
    );
    console.log("[Best Practice] abgelaufenes Token:", pruefeToken(abgelaufen, geheimnis));

    console.log(
      "[Best Practice] darfZugreifen(user -> admin):",
      darfZugreifen("user", "admin"),
      "| (admin -> user):",
      darfZugreifen("admin", "user")
    );
  };

  demo().catch((fehler: unknown) => {
    console.error("Fehler in der Demo:", fehler);
    process.exitCode = 1;
  });
}

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Die Discriminated Union `Ergebnis<T>` ist hier der eigentliche Held: Weil
// `login` und `pruefeToken` entweder { ok: true, wert } oder { ok: false,
// fehler } zurueckgeben, kann kein Aufrufer versehentlich mit einem
// ungeprueften Benutzer weiterarbeiten - TypeScript laesst den Zugriff auf
// `.wert` schlicht nicht zu, bevor `ok` geprueft wurde. Sicherheitsluecken
// durch vergessene Fehlerbehandlung werden so zu Compilerfehlern.
