
# Prompt Collection Manager

<p align="center">
  <img src="https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E" alt="JavaScript">
  <img src="https://img.shields.io/badge/playwright-%232EAD33.svg?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright">
</p>

Un'applicazione web frontend per creare, gestire e organizzare in modo efficiente la tua collezione di "prompt". Archivia tutto localmente nel tuo browser, senza bisogno di un backend.

## ✨ Caratteristiche Principali

- **Organizzazione Gerarchica**: Organizza i tuoi prompt in cartelle e sottocartelle per una navigazione intuitiva e ordinata.
- **Visualizzazione Flessibile**: Passa da una vista strutturata e di facile lettura a una visualizzazione YAML grezza per un controllo completo.
- **Editor Integrato**: Crea e modifica prompt e metadati direttamente dall'interfaccia.
- **Ricerca Potente**: Trova rapidamente i prompt di cui hai bisogno con una funzione di ricerca in tempo reale.
- **Import/Export**: Salva la tua intera collezione in un file `.json` per il backup o per trasferirla su un altro dispositivo.
- **Tema Chiaro e Scuro**: Scegli il tema che preferisci per un'esperienza visiva ottimale.
- **Gestione Locale**: Tutti i dati vengono salvati in modo sicuro nel `localStorage` del tuo browser.

## 🚀 Come Iniziare

Dato che si tratta di un'applicazione puramente frontend, non è necessaria alcuna installazione.

1.  Clona questo repository:
    ```bash
    git clone https://github.com/tuo-utente/prompt-manager-web.git
    ```
2.  Apri il file `index.html` in un browser web moderno.

## 🛠️ Sviluppo e Test

Il progetto utilizza **Playwright** per i test di integrazione.

1.  **Installa le dipendenze**:
    ```bash
    npm install
    ```
2.  **Installa i browser per Playwright**:
    ```bash
    npx playwright install
    ```
3.  **Esegui i test**:
    - Per eseguire i test in modalità headless:
      ```bash
      npm test
      ```
    - Per eseguire i test con l'interfaccia utente del browser visibile:
      ```bash
      npm run test:headed
      ```
    - Per avviare l'interfaccia utente di Playwright:
      ```bash
      npm run test:ui
      ```

## 💻 Tecnologie Utilizzate

- **HTML5**
- **CSS3**
- **JavaScript (ES6+)**
- **js-yaml**: Per la gestione e la conversione dei dati in formato YAML.
- **Playwright**: Per i test di integrazione.

## 📄 Licenza

Questo progetto è rilasciato sotto la licenza [MIT](LICENSE). 