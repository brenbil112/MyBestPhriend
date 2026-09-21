document.addEventListener('DOMContentLoaded', function () {

    const inputBox = document.getElementById('input-box');
    const submitButton = document.getElementById('submit-button');
    const matchList = document.getElementById('match-list');
    const clinicalKeyLink = document.getElementById('clinical-key-link');

    async function loadJson(path) {
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(`Unable to load ${path} (${response.status})`);
      }

      return response.json();
    }
  
    clinicalKeyLink.style.display = 'none';
  
    submitButton.addEventListener('click', async function () {
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
  
      matchList.innerHTML = '';
  
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
        clinicalKeyLink.style.display = 'block';
        clinicalKeyLink.target = '_blank';
  
      } catch (err) {
        console.error(err);
        matchList.innerHTML = '<li class="error-message">Lookup data could not be loaded. Please try again.</li>';
      }
  
      submitButton.disabled = false;
      submitButton.textContent = 'Submit';
    });
  });
  