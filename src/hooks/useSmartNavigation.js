// src/hooks/useSmartNavigation.js
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasAvailableShops } from '../services/userService';

/**
 * Hook personalizzato per la navigazione intelligente
 * Reindirizza a /negozi/nuovo se ci sono negozi disponibili, altrimenti a /payment
 */
export const useSmartNavigation = () => {
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();

  /**
   * Naviga intelligentemente in base ai negozi disponibili
   * @param {object} options - Opzioni di navigazione
   * @param {string} options.createPath - Path per la creazione (default: '/negozi/nuovo')
   * @param {string} options.paymentPath - Path per il pagamento (default: '/payment')
   * @param {function} options.onHasShops - Callback quando ci sono negozi disponibili
   * @param {function} options.onNoShops - Callback quando non ci sono negozi disponibili
   * @param {function} options.onError - Callback per errori
   */
  const navigateToCreateShop = useCallback(async (options = {}) => {
    const {
      createPath = '/negozi/nuovo',
      paymentPath = '/payment',
      onHasShops,
      onNoShops,
      onError
    } = options;

    try {
      setIsChecking(true);
      
      console.log('🔍 Controllo negozi disponibili...');
      const hasShops = await hasAvailableShops();
      
      if (hasShops) {
        console.log('✅ Negozi disponibili trovati, navigazione alla creazione');
        if (onHasShops) onHasShops();
        navigate(createPath);
      } else {
        console.log('❌ Nessun negozio disponibile, navigazione al pagamento');
        if (onNoShops) onNoShops();
        navigate(paymentPath);
      }
    } catch (error) {
      console.error('❌ Errore nella verifica dei negozi disponibili:', error);
      if (onError) onError(error);
      
      // In caso di errore, vai al pagamento per sicurezza
      navigate(paymentPath);
    } finally {
      setIsChecking(false);
    }
  }, [navigate]);

  /**
   * Versione semplificata per l'uso più comune
   */
  const goToCreateShop = useCallback(() => {
    return navigateToCreateShop();
  }, [navigateToCreateShop]);

  /**
   * Naviga alla lista negozi
   */
  const goToShopsList = useCallback(() => {
    navigate('/negozi');
  }, [navigate]);

  /**
   * Naviga al pagamento
   */
  const goToPayment = useCallback(() => {
    navigate('/payment');
  }, [navigate]);

  /**
   * Naviga alla dashboard
   */
  const goToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  return {
    // Funzioni di navigazione
    navigateToCreateShop,
    goToCreateShop,
    goToShopsList,
    goToPayment,
    goToDashboard,
    
    // Stati
    isChecking,
    
    // Utilities
    navigate // Espone navigate per usi custom
  };
};

/**
 * Hook per ottenere le props del bottone "Aggiungi Negozio" 
 * Include testo, icona e stato di caricamento appropriati
 */
export const useSmartButton = () => {
  const { goToCreateShop, isChecking } = useSmartNavigation();
  const [availableShops, setAvailableShops] = useState(null);

  // Questa funzione può essere chiamata per aggiornare lo stato del bottone
  const updateShopsCount = useCallback((count) => {
    setAvailableShops(count);
  }, []);

  // Genera le props del bottone in base allo stato
  const getButtonProps = useCallback(() => {
    const baseProps = {
      onClick: goToCreateShop,
      disabled: isChecking
    };

    if (isChecking) {
      return {
        ...baseProps,
        className: 'btn-primary loading',
        children: (
          <>
            <i className="fas fa-spinner fa-spin"></i> Verifica...
          </>
        )
      };
    }

    if (availableShops === null) {
      // Stato di caricamento iniziale
      return {
        ...baseProps,
        className: 'btn-primary',
        children: (
          <>
            <i className="fas fa-plus"></i> Aggiungi Negozio
          </>
        )
      };
    }

    if (availableShops > 0) {
      return {
        ...baseProps,
        className: 'btn-primary',
        children: (
          <>
            <i className="fas fa-plus"></i> Crea Negozio ({availableShops} disponibili)
          </>
        )
      };
    }

    return {
      ...baseProps,
      className: 'btn-primary purchase',
      children: (
        <>
          <i className="fas fa-shopping-cart"></i> Acquista Abbonamento
        </>
      )
    };
  }, [goToCreateShop, isChecking, availableShops]);

  return {
    getButtonProps,
    updateShopsCount,
    isChecking,
    availableShops
  };
};

export default useSmartNavigation;