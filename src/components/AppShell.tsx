import React from 'react';
import styled from 'styled-components';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return <ShellContainer>{children}</ShellContainer>;
};

const ShellContainer = styled.div`
  max-width: ${({ theme }) => theme.layout.appMaxWidth};
  margin: 0 auto;
  min-height: 100vh;
  background: transparent;
  position: relative;
  overflow-x: hidden;
  border: 0.5px solid #0000000d;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.08);
`;
