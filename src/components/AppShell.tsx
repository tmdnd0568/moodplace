import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useStore } from '../store/StoreContext';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { state, dispatch } = useStore();

  useEffect(() => {
    if (state.toastMessage) {
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_TOAST' });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [state.toastMessage, dispatch]);

  return (
    <ShellContainer>
      {children}
      {state.toastMessage && (
        <ToastFloatingPill role="alert">
          {state.toastMessage}
        </ToastFloatingPill>
      )}
    </ShellContainer>
  );
};

const ShellContainer = styled.div`
  max-width: ${({ theme }) => theme.layout.appMaxWidth};
  width: 100%;
  margin: 0 auto;
  min-height: 100vh;
  min-height: 100dvh;
  background: transparent;
  position: relative;
  border: 0.5px solid #0000000d;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.08);
  overflow-x: hidden;
`;

const ToastFloatingPill = styled.div`
  position: fixed;
  bottom: 84px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
  background: rgba(26, 26, 26, 0.92);
  color: #ffffff;
  padding: 11px 22px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(8px);
  max-width: 340px;
  width: max-content;
  text-align: center;
  pointer-events: none;
  animation: toastSlideUp 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  @keyframes toastSlideUp {
    from {
      opacity: 0;
      transform: translate(-50%, 14px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
`;
