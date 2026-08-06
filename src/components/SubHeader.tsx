import React from 'react';
import styled from 'styled-components';
import { Icon } from './icons/Icons';

interface SubHeaderProps {
  title?: string;
  onBack: () => void;
  rightActions?: Array<{
    icon: string;
    onClick: () => void;
    label: string;
    active?: boolean;
    activeColor?: string;
  }>;
}

export const SubHeader: React.FC<SubHeaderProps> = ({
  title,
  onBack,
  rightActions = [],
}) => {
  return (
    <HeaderContainer>
      <IconButton type="button" onClick={onBack} aria-label="뒤로가기">
        <Icon name="back" className="icon" />
      </IconButton>
      
      {title && <Title>{title}</Title>}
      
      <ActionsGroup>
        {rightActions.map((action, idx) => (
          <IconButton
            key={idx}
            type="button"
            onClick={action.onClick}
            aria-label={action.label}
            className={action.active ? 'active' : ''}
            $activeColor={action.activeColor}
          >
            <Icon name={action.icon} className="icon" />
          </IconButton>
        ))}
      </ActionsGroup>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  position: sticky;
  top: 0;
  z-index: 10;
  height: 56px;
`;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
`;

const ActionsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;

const IconButton = styled.button<{ $activeColor?: string }>`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.pill};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  .icon {
    width: 22px;
    height: 22px;
  }

  &.active {
    color: ${({ $activeColor, theme }) => $activeColor || theme.colors.primary};
  }
`;
