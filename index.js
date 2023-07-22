const express = require('express');
const http = require('http');

const app = express();
const port = 8008;
const TIMEOUT_MS = 500;

// Api endpoin that is localhost:8080/numbers
app.get('/numbers', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter (url) is required.' });
  }

  try {
    
    const urls = Array.isArray(url) ? url : [url];
    const uniqueNumbersSet = new Set();

    // creating an array to promise to fetch the data 
    const fetchPromises = urls.map(fetchDataFromURL);

    
    const results = await Promise.allSettled(fetchPromises);

    // to merge unique no
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const data = result.value;
        if (data && data.numbers && Array.isArray(data.numbers)) {
          data.numbers.forEach((number) => uniqueNumbersSet.add(number));
        }
      } else {
        console.error(`Error fetching data from URL: ${result.reason.url}`);
      }
    });

    const mergedNumbers = Array.from(uniqueNumbersSet).sort((a, b) => a - b);
    res.json({ numbers: mergedNumbers });
  } catch (error) {
    console.error('An error occurred while processing the request.', error.message);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});

// function for fetching data using get to return a promise
function fetchDataFromURL(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    });

    req.on('error', (error) => reject(error));
    req.setTimeout(TIMEOUT_MS, () => req.abort());
  });
}


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
