import React from 'react';
import styled from 'styled-components';
import { Icon } from './icons/Icons';

interface MainHeaderProps {
  onNotificationClick?: () => void;
  hasNotification?: boolean;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  onNotificationClick,
  hasNotification = true,
}) => {
  return (
    <HeaderContainer>
      <BrandLogo>
        <LogoImg src="/assets/logo_01.png" alt="MoodPlace" />
      </BrandLogo>
      <IconButton type="button" onClick={onNotificationClick} aria-label="알림">
        <Icon name="bell" className="icon" />
        {hasNotification && <NotifDot />}
      </IconButton>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[5]};
  background: ${({ theme }) => theme.colors.bg};
  position: sticky;
  top: 0;
  z-index: 5;
`;

const BrandLogo = styled.div`
  display: flex;
  align-items: center;
  line-height: 1.1;
`;

const LogoImg = styled.img`
  height: 48px;
  max-height: 52px;
  width: auto;
  object-fit: contain;
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.pill};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  .icon {
    width: 22px;
    height: 22px;
  }
`;

const NotifDot = styled.span`
  position: absolute;
  top: 9px;
  right: 9px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e2574c;
  border: 1.5px solid ${({ theme }) => theme.colors.bg};
`;
