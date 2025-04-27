// src/features/negozi/NegozioDetailsPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import NegozioHub from '../../components/negozi/NegozioHub';

const NegozioDetailsPage = () => {
  const { id } = useParams();
  
  return <NegozioHub negozioId={id} />;
};

export default NegozioDetailsPage;