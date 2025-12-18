import { useState } from 'react';
import { PurchaseOrderBookPage } from './components/PurchaseOrderBookPage';
import { ScopeAndRoutinesPage } from './components/ScopeAndRoutinesPage';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'supply' | 'scope-routines'>('supply');

  const handleNavigate = (page: string) => {
    if (page === 'scope-routines') {
      setCurrentPage('scope-routines');
    } else if (page === 'supply') {
      setCurrentPage('supply');
    }
  };

  if (currentPage === 'scope-routines') {
    return <ScopeAndRoutinesPage onNavigate={handleNavigate} />;
  }

  return <PurchaseOrderBookPage onNavigate={handleNavigate} />;
}

export default App;
