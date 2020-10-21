const fetch = require('node-fetch');

async function getCasesByCountry(country) {
    const URL = 'https://coronavirus-19-api.herokuapp.com/countries';
    const data = await fetch(URL);
    const json = await data.json();

    return json.find(item => item.country.toLowerCase() === country.toLowerCase());
}

async function getAllCases() {
    const URL = 'https://coronavirus-19-api.herokuapp.com/all';

    const data = await fetch(URL);
    return data.json();
}

module.exports = {getCasesByCountry, getAllCases};

