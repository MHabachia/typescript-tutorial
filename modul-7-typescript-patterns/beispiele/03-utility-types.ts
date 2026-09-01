/**
 * MODUL 7.2 - Utility Types
 * ============================================================================
 * TypeScript bringt eingebaute "Utility Types" mit, die bestehende Typen
 * automatisch transformieren - z.B. um alle Felder optional zu machen
 * (Partial), einzelne Felder auszuwaehlen (Pick) oder auszuschliessen (Omit).
 * Das verhindert doppelten, manuell gepflegten Typ-Code.
 */

interface Benutzer {
  id: string;
  name: string;
  email: string;
  passwortHash: string;
}

// -----------------------------------------------------------------------
// ANTI-PATTERN: Fast identische Typen von Hand duplizieren
// -----------------------------------------------------------------------
// Fuer ein Update-Formular "kopiert" man alle Felder und macht sie optional -
// bei jeder Aenderung an "Benutzer" muss man ALLE Kopien manuell nachpflegen:
interface BenutzerUpdateFalsch {
  id?: string;
  name?: string;
  email?: string;
  passwortHash?: string;
}

// Fuer eine oeffentliche Ansicht kopiert man die Felder erneut, diesmal ohne
// das Passwort - wieder eine Fehlerquelle, wenn sich "Benutzer" aendert:
interface BenutzerOeffentlichFalsch {
  id: string;
  name: string;
  email: string;
}

const updateFalsch: BenutzerUpdateFalsch = { name: "Neuer Name" };
const oeffentlichFalsch: BenutzerOeffentlichFalsch = {
  id: "1",
  name: "Neuer Name",
  email: "neu@example.com",
};
console.log("[Anti-Pattern] updateFalsch:", updateFalsch);
console.log("[Anti-Pattern] oeffentlichFalsch:", oeffentlichFalsch);

// -----------------------------------------------------------------------
// BEST PRACTICE: Utility Types leiten neue Typen automatisch ab
// -----------------------------------------------------------------------

// Partial<T>: macht ALLE Felder von T optional - ideal fuer Update-DTOs.
type BenutzerUpdate = Partial<Benutzer>;

// Omit<T, Keys>: uebernimmt alle Felder von T AUSSER den genannten.
type BenutzerOeffentlich = Omit<Benutzer, "passwortHash">;

// Pick<T, Keys>: uebernimmt NUR die genannten Felder von T.
type BenutzerLoginDaten = Pick<Benutzer, "email" | "passwortHash">;

// Readonly<T>: macht alle Felder unveraenderlich (Schutz vor Mutation).
type BenutzerUnveraenderlich = Readonly<Benutzer>;

// Record<Keys, T>: erzeugt einen Objekt-Typ mit festen Schluesseln vom Typ T.
type BenutzerNachId = Record<string, Benutzer>;

// Required<T>: macht ALLE Felder verpflichtend (Gegenteil von Partial).
type BenutzerVollstaendig = Required<BenutzerUpdate>;

const update: BenutzerUpdate = { name: "Ada Lovelace" }; // alle Felder optional
const oeffentlich: BenutzerOeffentlich = {
  id: "1",
  name: "Ada Lovelace",
  email: "ada@example.com",
}; // kein passwortHash noetig - und auch nicht erlaubt!

const loginDaten: BenutzerLoginDaten = {
  email: "ada@example.com",
  passwortHash: "gehashter-wert",
};

const unveraenderlicherNutzer: BenutzerUnveraenderlich = {
  id: "2",
  name: "Grace Hopper",
  email: "grace@example.com",
  passwortHash: "gehashter-wert",
};
// unveraenderlicherNutzer.name = "anders"; // Fehler: readonly darf nicht ueberschrieben werden

const registrierteNutzer: BenutzerNachId = {
  "1": oeffentlich as Benutzer,
};

console.log("[Best Practice] update:", update);
console.log("[Best Practice] oeffentlich:", oeffentlich);
console.log("[Best Practice] loginDaten:", loginDaten);
console.log("[Best Practice] unveraenderlicherNutzer:", unveraenderlicherNutzer);
console.log("[Best Practice] registrierteNutzer Keys:", Object.keys(registrierteNutzer));

// Required<T> verlangt wieder ALLE Felder - aus dem optionalen Update-DTO
// wird so ein vollstaendiger Datensatz:
const vollstaendigerNutzer: BenutzerVollstaendig = {
  id: "3",
  name: "Alan Turing",
  email: "alan@example.com",
  passwortHash: "gehashter-wert",
};
console.log("[Best Practice] vollstaendigerNutzer:", vollstaendigerNutzer.name);

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Definiere EINEN "Source of Truth"-Typ (hier: `Benutzer`) und leite alle
// anderen Varianten (Update-DTO, oeffentliche Ansicht, Login-Daten, ...) mit
// Utility Types davon ab. Aenderst du spaeter `Benutzer` (z.B. ein neues
// Feld), aktualisieren sich alle abgeleiteten Typen automatisch mit -
// der Compiler zeigt dir sofort, wo du noch reagieren musst.
