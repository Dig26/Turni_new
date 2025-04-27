// src/pages/NegozioHubPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import NegozioHub from '../components/negozi/NegozioHub';

const NegozioHubPage = () => {
  const { id } = useParams();
  
  return <NegozioHub negozioId={id} />;
};

export default NegozioHubPage;