/**
 * MODUL 6.2 - Passwoerter richtig speichern
 * ============================================================================
 * Ein Passwort ist ein Geheimnis, das dein Server nie erfahren muss. Er muss
 * nur pruefen koennen, ob jemand es kennt. Genau dafuer gibt es
 * Passwort-Hashverfahren:
 *   - Klartext        - katastrophal (jeder Datenbank-Leak ist ein Total-Leak)
 *   - MD5 / SHA-256   - zu schnell und ohne Salt (fuer Passwoerter ungeeignet)
 *   - scrypt/bcrypt/argon2 - absichtlich langsam, mit Salt, pro Passwort neu
 *
 * WICHTIG - das hier ist Lehrmaterial:
 * Die Demo unten nutzt "scrypt" aus node:crypto, weil es ohne zusaetzliche
 * Abhaengigkeit laeuft und das Prinzip gut zeigt. In echten Projekten nimmt
 * man eine etablierte, gepflegte Bibliothek (argon2 oder bcrypt) bzw. einen
 * fertigen Identity-Provider - dort sind Parameterwahl, Formatierung und
 * spaetere Migration bereits geloest. Baue Passwort-Speicherung nicht selbst.
 */

import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// -----------------------------------------------------------------------
// ANTI-PATTERN: Klartext oder ein schneller Hash ohne Salt
// -----------------------------------------------------------------------
interface BenutzerFalsch {
  readonly name: string;
  readonly passwort: string; // Klartext in der Datenbank. Nie. Niemals.
}

const kontoFalsch: BenutzerFalsch = { name: "Ada", passwort: "hunter2" };
console.log(
  "[Anti-Pattern] Klartext in der DB:",
  kontoFalsch.passwort,
  "<- ein Leak reicht, und alle Konten sind offen"
);

// Auch der naheliegende "Fix" ist keiner: SHA-256 ist ein Pruefsummen-
// Verfahren fuer Dateien - schnell gebaut, damit man Gigabytes pruefen kann.
// Genau diese Geschwindigkeit ist bei Passwoertern das Problem. Und ohne
// Salt ergibt dasselbe Passwort bei jedem Benutzer denselben Hash - zwei
// gleiche Eintraege verraten also zwei gleiche Passwoerter.
const sha256Ada = createHash("sha256").update("hunter2").digest("hex");
const sha256Grace = createHash("sha256").update("hunter2").digest("hex");
console.log("[Anti-Pattern] SHA-256 (Ada, gekuerzt):  ", sha256Ada.slice(0, 16), "...");
console.log("[Anti-Pattern] SHA-256 (Grace, gekuerzt):", sha256Grace.slice(0, 16), "...");
console.log(
  "[Anti-Pattern] Beide Hashes identisch?",
  sha256Ada === sha256Grace,
  "<- gleiches Passwort ist sofort erkennbar"
);

// -----------------------------------------------------------------------
// BEST PRACTICE: langsamer Hash + zufaelliger Salt pro Benutzer
// -----------------------------------------------------------------------

// scrypt ist callback-basiert. Wir verpacken es einmal in ein Promise, damit
// der restliche Code mit async/await lesbar bleibt.
const SCHLUESSEL_LAENGE = 64;

function scryptAsync(passwort: string, salt: Buffer): Promise<Buffer> {
  return new Promise((aufloesen, ablehnen) => {
    scrypt(passwort, salt, SCHLUESSEL_LAENGE, (fehler, schluessel) => {
      if (fehler !== null) {
        ablehnen(fehler);
        return;
      }
      aufloesen(schluessel);
    });
  });
}

// Der gespeicherte Wert enthaelt den Salt - er ist kein Geheimnis, er sorgt
// nur dafuer, dass jeder Hash einzigartig ist. Das Verfahren gleich mit
// abzuspeichern ist Absicht: so kannst du spaeter auf ein staerkeres
// Verfahren wechseln, ohne alte Eintraege zu verlieren.
async function hashePasswort(passwort: string): Promise<string> {
  const salt = randomBytes(16);
  const schluessel = await scryptAsync(passwort, salt);
  return `scrypt$${salt.toString("hex")}$${schluessel.toString("hex")}`;
}

async function passwortStimmt(passwort: string, gespeichert: string): Promise<boolean> {
  const teile = gespeichert.split("$");
  const verfahren = teile[0];
  const saltHex = teile[1];
  const schluesselHex = teile[2];

  // Defensiv: kaputte oder fremde Eintraege fuehren zu "nein", nicht zu
  // einem Absturz - und auch nicht zu einem versehentlichen "ja".
  if (verfahren !== "scrypt" || saltHex === undefined || schluesselHex === undefined) {
    return false;
  }

  const erwartet = Buffer.from(schluesselHex, "hex");
  if (erwartet.length !== SCHLUESSEL_LAENGE) {
    return false;
  }

  const berechnet = await scryptAsync(passwort, Buffer.from(saltHex, "hex"));

  // timingSafeEqual vergleicht in konstanter Zeit. Ein normales "===" bricht
  // beim ersten unterschiedlichen Byte ab - aus den winzigen Laufzeit-
  // unterschieden liesse sich theoretisch Information gewinnen. Beide Puffer
  // muessen gleich lang sein, sonst wirft die Funktion.
  return timingSafeEqual(berechnet, erwartet);
}

async function main(): Promise<void> {
  // Bewusst nur EIN Demo-Passwort - Kursmaterial soll keine Hashlisten
  // ausspucken.
  const gespeichert = await hashePasswort("ein-langes-passwort-2026");
  console.log("[Best Practice] gespeicherter Eintrag (gekuerzt):", gespeichert.slice(0, 40), "...");

  const zweiterEintrag = await hashePasswort("ein-langes-passwort-2026");
  console.log(
    "[Best Practice] gleiches Passwort, gleicher Hash?",
    gespeichert === zweiterEintrag,
    "<- dank Salt: nein"
  );

  console.log(
    "[Best Practice] richtiges Passwort:",
    await passwortStimmt("ein-langes-passwort-2026", gespeichert)
  );
  console.log(
    "[Best Practice] falsches Passwort:",
    await passwortStimmt("falsch", gespeichert)
  );
  console.log(
    "[Best Practice] kaputter DB-Eintrag:",
    await passwortStimmt("ein-langes-passwort-2026", "muell")
  );
}

main()
  .then(() => {
    console.log("[Best Practice] fertig - das Skript terminiert von selbst.");
  })
  .catch((fehler: unknown) => {
    const text = fehler instanceof Error ? fehler.message : String(fehler);
    console.error("[Best Practice] unerwarteter Fehler:", text);
    process.exitCode = 1;
  });

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Speichere das Verfahren und seine Parameter mit im Hash-String (oben das
// "scrypt$..."-Praefix). Rechenleistung wird jedes Jahr billiger, deine
// Parameter also jedes Jahr schwaecher. Mit dem Praefix kannst du beim
// naechsten erfolgreichen Login pruefen, ob der Eintrag veraltet ist, und ihn
// still auf das neue Verfahren umschreiben - du hast das Passwort in genau
// diesem Moment ja im Klartext vorliegen. Ohne Praefix bleibt dir nur, alle
// Benutzer zum Zuruecksetzen zu zwingen.
