document.addEventListener('DOMContentLoaded', function () {

    const inputBox = document.getElementById('input-box');
    const submitButton = document.getElementById('submit-button');
    const resetButton = document.getElementById('reset-button');
    const matchList = document.getElementById('match-list');
    const clinicalKeyLink = document.getElementById('clinical-key-link');
    // Program boxes shown under the results. Each reads a JSON file of
    // programs whose "matches" lists the drug names that trigger it.
    const programPanels = [
      {
        panel: document.getElementById('savings-panel'),
        list: document.getElementById('savings-list'),
        path: 'json/savings_programs.json',
        label: p => `${p.drug} savings program`
      },
      {
        panel: document.getElementById('assistance-panel'),
        list: document.getElementById('assistance-list'),
        path: 'json/patient_assistance.json',
        label: p => p.program
      }
    ];

    function clearPrograms() {
      programPanels.forEach(({ panel, list }) => {
        list.innerHTML = '';
        panel.hidden = true;
      });
    }

    // These boxes are extras: if a file fails to load, the interaction
    // report still works and that box stays hidden.
    async function showPrograms(matchedWords) {
      clearPrograms();

      await Promise.all(programPanels.map(async ({ panel, list, path, label }) => {
        let programs;
        try {
          programs = await loadJson(path);
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
          a.textContent = label(p);
          li.appendChild(a);
          if (p.manufacturer) {
            const span = document.createElement('span');
            span.className = 'savings-manufacturer';
            span.textContent = p.manufacturer;
            li.appendChild(span);
          }
          list.appendChild(li);
        });
        panel.hidden = false;
      }));
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
      clearPrograms();
      inputBox.focus();
    });
  
    submitButton.addEventListener('click', async function () {
      submitButton.disabled = true;
      resetButton.disabled = true;
      submitButton.textContent = 'Submitting...';
  
      matchList.innerHTML = '';
      clinicalKeyLink.hidden = true;
      clearPrograms();

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
          li.appendChild(document.createTextNode(match.word));

          const label = document.createElement('a');
          label.className = 'label-link';
          label.href = 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=' +
            encodeURIComponent(match.word);
          label.target = '_blank';
          label.rel = 'noopener noreferrer';
          label.textContent = 'FDA label';
          label.title = `Search DailyMed for the ${match.word} prescribing information`;
          li.appendChild(label);

          matchList.appendChild(li);
        });
  
        const clinicalKeyUrl =
          `https://www.clinicalkey.com/pharmacology/reports/interactions?` +
          matches.map(m => `gpcid=${m.number}`).join('&');
  
        clinicalKeyLink.href = clinicalKeyUrl;
        clinicalKeyLink.hidden = false;

        await showPrograms(new Set(matches.map(m => m.word)));

      } catch (err) {
        console.error(err);
        matchList.innerHTML = '<li class="error-message">Lookup data could not be loaded. Please try again.</li>';
      }
  
      submitButton.disabled = false;
      resetButton.disabled = false;
      submitButton.textContent = 'Submit';
    });
  });
  