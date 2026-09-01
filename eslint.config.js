// ESLint Flat Config fuer TypeScript (siehe Modul 5: Werkzeuge & Workflow).
// IntelliJ IDEA erkennt diese Datei automatisch, wenn unter
// Settings -> Languages & Frameworks -> Code Quality Tools -> ESLint
// die Option "Automatic ESLint Configuration" aktiv ist.
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  ...tseslint.configs.recommended,
  {
    // Diese Konfigurationsdatei ist selbst CommonJS (sie MUSS require()
    // benutzen, weil ESLint sie als .js-Datei laedt). Die Regel gilt daher
    // nur fuer den TypeScript-Code des Kurses.
    files: ['**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    rules: {
      // In diesem Kurs wird "any" in den Anti-Pattern-Beispielen BEWUSST
      // verwendet, um zu zeigen, was ohne Typsicherheit passiert.
      // Deshalb hier nur eine Warnung statt eines Fehlers.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  }
);
