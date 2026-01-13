chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'userInput') {
      const words = request.data; // Get the array of words
      console.log('Received words:', words); // Log the received words
  
      // Convert all words to lowercase
      const lowercaseWords = words.map(word => word.toLowerCase());
      console.log('Lowercase words:', lowercaseWords); // Log the lowercase words
  
      // Filter the words (now lowercase)
      const filteredWords = lowercaseWords.filter(word => {
        return /^[a-zA-Z]/.test(word) && word.length >= 3;
      });
      console.log('Filtered words:', filteredWords); // Log the filtered words
  
      // Load stop words from stop_words.json
      fetch('../json/stop_words.json')
        .then(response => response.json())
        .then(stopWords => {
          console.log('Stop words:', stopWords); // Log the stop words
          // Remove stop words from the filtered list
          const finalWords = filteredWords.filter(word => !stopWords.includes(word));
          console.log('Final words:', finalWords); // Log the final words
  
          // Load drug list from drug_list.json
          fetch('../json/drug_list.json')
            .then(response => response.json())
            .then(drugList => {
              console.log('Drug list:', drugList); // Log the drug list
              // Find matches and get associated numbers
              const matches = [];
              finalWords.forEach(word => {
                let found = false; // Flag to track if a match is found
                drugList.forEach(item => {
                  if (item[Object.keys(item)[0]].includes(word)) {
                    matches.push({ number: Object.keys(item)[0], word: word }); // Add the number and word to the matches array
                    found = true; // Set the flag to true
                    return; // Exit the inner loop
                  }
                });
                if (found) {
                  return; // Exit the outer loop if a match is found
                }
              });
              console.log('Matches:', matches); // Log the matches
  
              // Construct the ClinicalKey URL
              const clinicalKeyUrl = `https://www.clinicalkey.com/pharmacology/reports/interactions?gpcid=${matches.map(match => match.number).join('&gpcid=')}`;
              console.log('ClinicalKey URL:', clinicalKeyUrl); // Log the ClinicalKey URL
  
              // Send the matches and the ClinicalKey URL back to the popup
              sendResponse({ filteredWords: matches, clinicalKeyUrl: clinicalKeyUrl }); 
            })
            .catch(error => {
              console.error('Error loading drug_list.json:', error);
              sendResponse({ error: 'Error loading drug list' });
            });
        })
        .catch(error => {
          console.error('Error loading stop_words.json:', error);
          sendResponse({ error: 'Error loading stop words' });
        });
  
      // Important: Return true to indicate that we'll send a response asynchronously
      return true; 
    }
  });