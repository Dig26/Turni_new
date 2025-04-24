 
// src/pages/DipendentiPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import DipendentiList from '../components/DipendentiList';

const DipendentiPage = () => {
  const { negozioId } = useParams();
  return <DipendentiList negozioId={negozioId} />;
};

export default DipendentiPage;