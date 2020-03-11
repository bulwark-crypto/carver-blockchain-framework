import React from 'react';
import './App.css';

import { CarverUserContextProvider } from './core/react/contexts/CarverUser';
import { SocketContextProvider } from './core/react/contexts/Socket';

import RenderRootObject from './core/react/elements/RenderRootObject';

const App: React.FC = () => {
  return (
    <SocketContextProvider>
      <CarverUserContextProvider>
        <RenderRootObject />
      </CarverUserContextProvider>
    </SocketContextProvider>
  );
}

export default App;
