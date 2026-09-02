import React from 'react';
import styled from 'styled-components';
import { Icon } from './icons/Icons';

interface BottomNavProps {
  activeTab: string;
  onChangeTab: (tabId: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'home', label: '홈', icon: 'home' },
    { id: 'explore', label: '지도', icon: 'map' },
    { id: 'bookmarks', label: '북마크', icon: 'bookmark' },
    { id: 'profile', label: '마이페이지', icon: 'user' },
  ];

  return (
    <NavContainer aria-label="하단 탭">
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? 'is-active' : ''}
          onClick={() => onChangeTab(tab.id)}
          aria-label={tab.label}
          aria-current={activeTab === tab.id}
        >
          <Icon name={tab.icon} className="icon" />
        </TabButton>
      ))}
    </NavContainer>
  );
};

const NavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: ${({ theme }) => theme.layout.appMaxWidth};
  height: calc(60px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
  box-sizing: border-box;
`;

const TabButton = styled.button`
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 60px;
  border-radius: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  position: relative;
  transition: color 0.2s;

  .icon {
    width: 22px;
    height: 22px;
    position: relative;
    z-index: 1;
  }

  &.is-active {
    color: ${({ theme }) => theme.colors.text};
  }

  &.is-active::before {
    content: '';
    position: absolute;
    width: 44px;
    height: 36px;
    border: 1px solid ${({ theme }) => theme.colors.text};
    border-radius: 10px;
    pointer-events: none;
  }
`;
