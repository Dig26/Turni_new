import React from 'react';
import { useParams } from 'react-router-dom';
import TabellaTurni from '../components/TabellaTurni';

const TurniListPage = () => {
  const { negozioId } = useParams();
  return <TabellaTurni negozioId={negozioId} />;
};

export default TurniListPage;