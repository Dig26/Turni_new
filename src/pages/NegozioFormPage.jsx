 
 
// src/pages/NegozioFormPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import NegozioForm from '../components/NegozioForm';

const NegozioFormPage = () => {
  const { id } = useParams();
  return <NegozioForm negozioId={id} />;
};

export default NegozioFormPage;