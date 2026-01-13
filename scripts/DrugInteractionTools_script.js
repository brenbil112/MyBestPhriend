document.addEventListener('DOMContentLoaded', function() {

    const inputBox = document.getElementById('input-box');
  
    const submitButton = document.getElementById('submit-button');
  
    const clinicalKeyLink = document.getElementById('clinical-key-link');
    clinicalKeyLink.style.display = 'none';
  
    submitButton.addEventListener('click', function() {
        this.disabled = true;
        this.value = 'Submitting...';
  
        const userInput = inputBox.value;
  
        const userInputnoc = userInput.replace(/,/g, ""); 
  
        const unfilteredWords = userInputnoc.split(/\s+/);
  
        // Remove leading hyphens from each word
        const words = unfilteredWords.map(word => {
          return word.startsWith('-') ? word.slice(1) : word;
          });
  
        chrome.runtime.sendMessage({ action: 'userInput', data: words }, (response) => {
  
            if (response.filteredWords) {
                const matches = response.filteredWords;
  
                const matchList = document.getElementById('match-list');
  
                const header = document.createElement('h3');
                header.textContent = 'Drug matches found:';
  
                matchList.parentNode.insertBefore(header, matchList);
  
  
                matches.forEach(match => {
  
                    const listItem = document.createElement('li');
  
                    listItem.textContent = `${match.word}`;
  
                    matchList.appendChild(listItem);
                });
  
                document.body.appendChild(matchList);
  
  
                // Create a link to ClinicalKey
                const clinicalKeyLink = document.createElement('a');
                clinicalKeyLink.href = response.clinicalKeyUrl;
                clinicalKeyLink.textContent = 'Click here to open a new tab with drug interactions report';
                clinicalKeyLink.target = "_blank"; //Open in a new tab
  
                // Append the link to the popup's body
                document.body.appendChild(clinicalKeyLink);
  
            } else if (response.error) {
                console.error('Error from background script:', response.error);
                alert(response.error);
                // Re-enable the button if there's an error
                this.disabled = false;
                this.value = 'Submit';
            }
        });
    });
  });