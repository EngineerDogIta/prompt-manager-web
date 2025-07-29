const { test, expect } = require('@playwright/test');

test.describe('Prompt Collection Manager - Suite di Test Completa', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.tree-node'); // Assicura che l'albero sia caricato
    
    // Espandi tutti i nodi e attendi che un elemento nidificato sia visibile
    await page.click('#expand-all-btn');
    await page.waitForSelector('.tree-node[data-id*="prompt-"]:has-text("AI Code Review")');
  });

  // --- GRUPPO 1: FUNZIONALITÀ DI BASE E UI ---

  test('Test 1: Caricamento iniziale e Interfaccia Utente', async ({ page }) => {
    // Schermata di benvenuto
    await expect(page.locator('#welcome-screen')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Benvenuto in Prompt Collection Manager');

    // Pulsanti principali
    await expect(page.locator('#add-prompt-btn')).toBeVisible();
    await expect(page.locator('#add-folder-btn')).toBeVisible();
    await expect(page.locator('#import-btn')).toBeVisible();
    await expect(page.locator('#export-btn')).toBeVisible();
  });

  test('Test 2: Funzionalità di Ricerca e Cambio Tema', async ({ page }) => {
    // Test della ricerca
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test ricerca');
    await expect(searchInput).toHaveValue('test ricerca');
    await page.click('#search-clear');
    await expect(searchInput).toHaveValue('');

    // Test del cambio tema
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('data-theme');
    await page.click('#theme-toggle');
    await expect(html).not.toHaveAttribute('data-theme', initialTheme);
  });

  // --- GRUPPO 2: GESTIONE PROMPT ---

  test.describe('Gestione dei Prompt', () => {
    
    const getItems = (page) => page.evaluate(() => 
      Array.from(document.querySelectorAll('#tree-view .tree-node')).map(item => ({
        id: item.dataset.id || item.dataset.path,
        text: item.querySelector('.tree-node__label').textContent.trim()
      }))
    );

    test('Test 3: Creazione e Annullamento Nuovo Prompt', async ({ page }) => {
      await page.click('#add-prompt-btn');
      await expect(page.locator('#prompt-editor-modal')).toBeVisible();
      await expect(page.locator('#editor-title')).toContainText('Nuovo Prompt');
      await page.click('#cancel-editor-btn');
      await expect(page.locator('#prompt-editor-modal')).not.toBeVisible();
    });

    test('Test 4: Eliminazione Prompt', async ({ page }) => {
      const initialItems = await getItems(page);
      const promptToDelete = initialItems.find(item => item.text === 'Furry 2D Art generator');
      expect(promptToDelete).toBeDefined();

      await page.locator(`.tree-node[data-id="${promptToDelete.id}"]`).click();
      await page.waitForSelector('#prompt-viewer');
      
      page.on('dialog', dialog => dialog.accept());
      await page.click('#delete-prompt-btn');
      await expect(page.locator('.toast--success')).toContainText('Prompt eliminato');

      const finalItems = await getItems(page);
      expect(finalItems.find(item => item.id === promptToDelete.id)).toBeUndefined();
      expect(finalItems.length).toBe(initialItems.length - 1);
    });

    test('Test 5: Duplicazione Prompt', async ({ page }) => {
        const initialItems = await getItems(page);
        
        // Trova il primo prompt disponibile (escludendo i preferiti) usando XPath per gestire la logica degli antenati
        const promptToDuplicate = page.locator('//div[contains(@class, "tree-node") and @data-type="prompt" and not(ancestor::div[@data-path="favorites"])]').first();
        await expect(promptToDuplicate).toBeVisible();
        const promptText = await promptToDuplicate.locator('.tree-node__label').textContent();

        // Duplica il prompt
        await promptToDuplicate.click({ button: 'right' });
        await page.waitForSelector('.context-menu');
        await page.click('.context-menu__item:has-text("Duplica")');
        await expect(page.locator('.toast--success')).toContainText('Prompt duplicato');

        // Verifica - attendi che il nuovo elemento appaia nell'albero
        const duplicatedPromptText = `${promptText.trim()} (Copy)`;
        const duplicatedPromptLocator = page.locator(`.tree-node__label:has-text("${duplicatedPromptText}")`);
        await expect(duplicatedPromptLocator).toBeVisible();

        const finalItems = await getItems(page);
        expect(finalItems.length).toBe(initialItems.length + 1);
    });

    test('Test 6: Aggiunta/Rimozione dai Preferiti', async ({ page }) => {
        // Trova un prompt che non sia già nei preferiti usando XPath
        const promptToFavorite = page.locator('//div[contains(@class, "tree-node") and @data-type="prompt" and not(ancestor::div[@data-path="favorites"])]').first();
        await expect(promptToFavorite).toBeVisible();

        const favoritesNode = page.locator('.tree-node[data-path="favorites"]');
        const initialFavoriteCount = await favoritesNode.locator('.tree-node[data-type="prompt"]').count();

        // Aggiungi ai preferiti
        await promptToFavorite.click({ button: 'right' });
        await page.waitForSelector('.context-menu');
        await page.click('.context-menu__item:has-text("Aggiungi ai preferiti")');
        await expect(page.locator('.toast:has-text("Aggiunto ai preferiti")')).toBeVisible();
        await expect(favoritesNode.locator('.tree-node[data-type="prompt"]')).toHaveCount(initialFavoriteCount + 1);

        // Rimuovi dai preferiti (usando lo stesso locator originale)
        await promptToFavorite.click({ button: 'right' });
        await page.waitForSelector('.context-menu');
        await page.click('.context-menu__item:has-text("Rimuovi dai preferiti")');
        await expect(page.locator('.toast:has-text("Rimosso dai preferiti")')).toBeVisible();
        await expect(favoritesNode.locator('.tree-node[data-type="prompt"]')).toHaveCount(initialFavoriteCount);
    });

  });

  // --- GRUPPO 3: QUALITÀ DEL CODICE E BUG FIXES ---

  test.describe('Qualità del Codice e Stabilità', () => {

    test('Test 7: Verifica Standard HTML e Assenza di Errori', async ({ page }) => {
      // 1. Verifica assenza di errori SVG
      const svgErrors = await page.evaluate(() => document.body.innerHTML.includes('0118'));
      expect(svgErrors).toBe(false);

      // 2. Verifica consistenza linguistica
      const pageText = await page.textContent('body');
      const englishTexts = ['Copy to Clipboard', 'Edit', 'Delete'];
      const foundEnglishTexts = englishTexts.some(text => pageText.includes(text));
      expect(foundEnglishTexts).toBe(false);

      // 3. Verifica assenza di onclick inline
      const onclickElements = await page.evaluate(() => document.querySelectorAll('[onclick]').length);
      expect(onclickElements).toBe(0);
    });

  });
}); 