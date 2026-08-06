import React from 'react';
import styled from 'styled-components';

interface MoodChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  emoji?: string;
}

export const MoodChip: React.FC<MoodChipProps> = ({
  label,
  isActive,
  onClick,
  emoji,
}) => {
  return (
    <ChipButton
      type="button"
      className={isActive ? 'is-active' : ''}
      onClick={onClick}
      aria-pressed={isActive}
    >
      {emoji && <Emoji>{emoji}</Emoji>}
      {label}
    </ChipButton>
  );
};

const ChipButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);

  &:hover {
    border-color: ${({ theme }) => theme.colors.primaryLight};
    background: #fbfbf9;
  }

  &.is-active {
    background: transparent;
    border: 0.5px solid #1a1a1a;
    color: ${({ theme }) => theme.colors.text};
    box-shadow: none;
  }
`;

const Emoji = styled.span`
  font-size: 15px;
`;
