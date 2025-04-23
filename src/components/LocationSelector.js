import React, { useState, useEffect } from 'react';
import { getCountries, getCities } from '../services/locationService';
import '../styles/LocationSelector.css';

function LocationSelector({ 
  selectedCountry, 
  selectedCity, 
  onCountryChange, 
  onCityChange 
}) {
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState('');
  
  // Carica l'elenco dei paesi
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await getCountries();
        setCountries(data);
      } catch (error) {
        console.error('Errore nel caricamento dei paesi:', error);
        setError('Errore nel caricamento dei paesi.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCountries();
  }, []);
  
  // Carica le città quando cambia il paese
  useEffect(() => {
    if (!selectedCountry) {
      setCities([]);
      return;
    }
    
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const data = await getCities(selectedCountry);
        setCities(data);
      } catch (error) {
        console.error(`Errore nel caricamento delle città per ${selectedCountry}:`, error);
        setError(`Errore nel caricamento delle città per ${selectedCountry}.`);
      } finally {
        setLoadingCities(false);
      }
    };
    
    fetchCities();
  }, [selectedCountry]);
  
  // Gestisce il cambio di paese
  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    onCountryChange(newCountry);
    onCityChange(''); // Reset città quando cambia il paese
  };
  
  // Gestisce il cambio di città
  const handleCityChange = (e) => {
    onCityChange(e.target.value);
  };
  
  if (loading) {
    return <div className="location-loading">Caricamento paesi...</div>;
  }
  
  return (
    <div className="location-selector">
      {error && <div className="location-error">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="country-select">Paese *</label>
        <select
          id="country-select"
          value={selectedCountry}
          onChange={handleCountryChange}
          className="country-select"
        >
          <option value="" disabled>Seleziona un paese</option>
          {countries.map(country => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="city-select">Città *</label>
        <select
          id="city-select"
          value={selectedCity}
          onChange={handleCityChange}
          className="city-select"
          disabled={!selectedCountry || loadingCities}
        >
          <option value="" disabled>
            {loadingCities
              ? 'Caricamento città...'
              : !selectedCountry
                ? 'Seleziona prima un paese'
                : 'Seleziona una città'
            }
          </option>
          {cities.map((city, index) => (
            <option key={index} value={city.name}>
              {city.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default LocationSelector;