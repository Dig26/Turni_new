 
// src/pages/DipendenteFormPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import DipendenteForm from '../components/DipendenteForm';

const DipendenteFormPage = () => {
  const { negozioId, id } = useParams();
  return <DipendenteForm negozioId={negozioId} dipendenteId={id} />;
};

export default DipendenteFormPage;