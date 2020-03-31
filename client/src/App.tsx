import React from 'react';
import './App.css';

import { CarverUserContextProvider } from './core/react/contexts/CarverUser';
import { SocketContextProvider } from './core/react/contexts/Socket';

import RenderRootObject from './core/react/elements/RenderRootObject';
import { Container } from '@material-ui/core';

const App: React.FC = () => {
  return (
    <SocketContextProvider>
      <CarverUserContextProvider>
        <Container>
          <RenderRootObject />
        </Container>
      </CarverUserContextProvider>
    </SocketContextProvider>
  );
}

export default App;
