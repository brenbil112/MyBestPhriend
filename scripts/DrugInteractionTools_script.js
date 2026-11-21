document.addEventListener('DOMContentLoaded', function () {

    const inputBox = document.getElementById('input-box');
    const submitButton = document.getElementById('submit-button');
    const resetButton = document.getElementById('reset-button');
    const matchList = document.getElementById('match-list');
    const clinicalKeyLink = document.getElementById('clinical-key-link');
    const savingsPanel = document.getElementById('savings-panel');
    const savingsList = document.getElementById('savings-list');

    function clearSavings() {
      savingsList.innerHTML = '';
      savingsPanel.hidden = true;
    }

    // Savings links are an extra: if the file fails to load, the
    // interaction report still works and the section stays hidden.
    async function showSavings(matchedWords) {
      clearSavings();

      let programs;
      try {
        programs = await loadJson('json/savings_programs.json');
      } catch (err) {
        console.error(err);
        return;
      }
      if (!Array.isArray(programs)) return;

      const found = programs.filter(p =>
        Array.isArray(p.matches) && p.matches.some(m => matchedWords.has(m))
      );
      if (found.length === 0) return;

      found.forEach(p => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = p.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = `${p.drug} savings program`;
        li.appendChild(a);
        if (p.manufacturer) {
          const span = document.createElement('span');
          span.className = 'savings-manufacturer';
          span.textContent = p.manufacturer;
          li.appendChild(span);
        }
        savingsList.appendChild(li);
      });
      savingsPanel.hidden = false;
    }

    async function loadJson(path) {
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(`Unable to load ${path} (${response.status})`);
      }

      return response.json();
    }

    resetButton.addEventListener('click', function () {
      inputBox.value = '';
      matchList.innerHTML = '';
      clinicalKeyLink.hidden = true;
      clinicalKeyLink.href = '#';
      clearSavings();
      inputBox.focus();
    });
  
    submitButton.addEventListener('click', async function () {
      submitButton.disabled = true;
      resetButton.disabled = true;
      submitButton.textContent = 'Submitting...';
  
      matchList.innerHTML = '';
      clinicalKeyLink.hidden = true;
      clearSavings();

      const userInput = inputBox.value;
      const cleaned = userInput.replace(/,/g, "");
      const words = cleaned
        .split(/\s+/)
        .map(w => w.replace(/^-/, '').toLowerCase())
        .filter(w => /^[a-z]/.test(w) && w.length >= 3);
  
      try {
        const stopWords = await loadJson('json/stop_words.json');
        const drugList = await loadJson('json/drug_list.json');

        if (!Array.isArray(stopWords) || !Array.isArray(drugList)) {
          throw new Error('Lookup data has an unexpected format');
        }
  
        const finalWords = words.filter(w => !stopWords.includes(w));
  
        const matches = [];
  
        finalWords.forEach(word => {
          drugList.forEach(item => {
            const key = Object.keys(item)[0];
            if (item[key].includes(word)) {
              matches.push({ number: key, word });
            }
          });
        });
  
        if (matches.length === 0) {
          matchList.innerHTML = '<li>No matches found.</li>';
          submitButton.disabled = false;
          resetButton.disabled = false;
          submitButton.textContent = 'Submit';
          return;
        }
  
        matches.forEach(match => {
          const li = document.createElement('li');
          li.textContent = match.word;
          matchList.appendChild(li);
        });
  
        const clinicalKeyUrl =
          `https://www.clinicalkey.com/pharmacology/reports/interactions?` +
          matches.map(m => `gpcid=${m.number}`).join('&');
  
        clinicalKeyLink.href = clinicalKeyUrl;
        clinicalKeyLink.hidden = false;

        await showSavings(new Set(matches.map(m => m.word)));

      } catch (err) {
        console.error(err);
        matchList.innerHTML = '<li class="error-message">Lookup data could not be loaded. Please try again.</li>';
      }
  
      submitButton.disabled = false;
      resetButton.disabled = false;
      submitButton.textContent = 'Submit';
    });
  });
  