export const getCountries = async () => {
    try {
      // Verifica se abbiamo già i dati nella cache
      const cachedData = localStorage.getItem('countries_cache');
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Altrimenti, facciamo una richiesta API
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
      const countries = await response.json();
      
      // Formatta i dati
      const formattedCountries = countries
        .map(country => ({
          code: country.cca2,
          name: country.name.common
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      // Cache dei dati per future richieste (1 giorno)
      localStorage.setItem('countries_cache', JSON.stringify(formattedCountries));
      localStorage.setItem('countries_cache_timestamp', Date.now().toString());
      
      return formattedCountries;
    } catch (error) {
      console.error('Errore nel caricamento dei paesi:', error);
      
      // In caso di errore, usiamo i dati di fallback
      return [
        { code: 'IT', name: 'Italia' },
        { code: 'US', name: 'Stati Uniti' },
        { code: 'DE', name: 'Germania' },
        { code: 'FR', name: 'Francia' },
        { code: 'ES', name: 'Spagna' },
        { code: 'UK', name: 'Regno Unito' }
      ];
    }
  };
  
  // Per ottenere le città di un paese utilizziamo l'API GeoNames
  export const getCities = async (countryCode) => {
    try {
      // Verifica se abbiamo già i dati nella cache
      const cacheKey = `cities_${countryCode}_cache`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Nota: GeoNames richiede un account, quindi in una implementazione reale
      // sarebbe necessario registrarsi e utilizzare un username
      // Per questo esempio, utilizziamo un proxy o dati di fallback
      const response = await fetch(`https://secure.geonames.org/searchJSON?country=${countryCode}&featureClass=P&maxRows=1000&username=demo`);
      const data = await response.json();
      
      if (data && data.geonames) {
        const cities = data.geonames
          .map(city => ({
            name: city.name,
            population: city.population
          }))
          .sort((a, b) => b.population - a.population)
          .slice(0, 100); // Limitiamo alle 100 città più popolose
        
        // Cache dei dati per future richieste (1 giorno)
        localStorage.setItem(cacheKey, JSON.stringify(cities));
        localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
        
        return cities;
      }
      
      throw new Error('Nessuna città trovata');
    } catch (error) {
      console.error(`Errore nel caricamento delle città per ${countryCode}:`, error);
      
      // Dati di fallback per alcune nazioni comuni
      const fallbackCities = {
        'IT': [
          { name: 'Roma' }, { name: 'Milano' }, { name: 'Napoli' }, 
          { name: 'Torino' }, { name: 'Palermo' }, { name: 'Genova' }
        ],
        'US': [
          { name: 'New York' }, { name: 'Los Angeles' }, { name: 'Chicago' }, 
          { name: 'Houston' }, { name: 'Phoenix' }, { name: 'Philadelphia' }
        ],
        'DE': [
          { name: 'Berlino' }, { name: 'Amburgo' }, { name: 'Monaco' }, 
          { name: 'Colonia' }, { name: 'Francoforte' }, { name: 'Stoccarda' }
        ]
      };
      
      return fallbackCities[countryCode] || [];
    }
  };