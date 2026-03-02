import React from 'react';
import AppRouter from './services/routes/AppRouter';
import Footer from './components/Footer';

import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <AppRouter />
      <Footer />
     
    </div>
  );
};

export default App;