 
// src/pages/TurniEditorPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import TabellaTurni from '../components/TabellaTurni';

const TurniEditorPage = () => {
  const { negozioId, anno, mese } = useParams();
  return <TabellaTurni negozioId={negozioId} anno={anno} mese={mese} />;
};

export default TurniEditorPage;