import React from 'react';
import styled from 'styled-components';
import type { Cafe } from '../store/types';
import { Icon } from './icons/Icons';

interface CafeCardProps {
  cafe: Cafe;
  isBookmarked: boolean;
  onCardClick: () => void;
  onBookmarkToggle?: (e: React.MouseEvent) => void;
  variant?: 'hero' | 'list';
}

export const CafeCard: React.FC<CafeCardProps> = ({
  cafe,
  isBookmarked,
  onCardClick,
  onBookmarkToggle,
  variant = 'list',
}) => {
  const renderPhotoStyle = () => {
    if (cafe.photo.type === 'image' && cafe.photo.image) {
      return {
        backgroundImage: `url(${cafe.photo.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      backgroundImage: `linear-gradient(160deg, ${cafe.photo.from}, ${cafe.photo.to})`,
    };
  };

  if (variant === 'hero') {
    return (
      <HeroCard onClick={onCardClick} role="button" tabIndex={0}>
        <HeroPhoto style={renderPhotoStyle()}>
          <MatchBadge>{cafe.match}% Match</MatchBadge>
          {cafe.photo.type !== 'image' && <PhotoEmoji>{cafe.photo.emoji}</PhotoEmoji>}
        </HeroPhoto>
        <CardBody>
          <TagRow>
            {cafe.tags.map((tag) => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </TagRow>
          <CafeName>{cafe.name}</CafeName>
          <CafeMeta>{cafe.location} • {cafe.description}</CafeMeta>
          {cafe.aiReason && (
            <CardAiReason>
              <Icon name="sparkle" className="ai-icon" />
              <span>{cafe.aiReason}</span>
            </CardAiReason>
          )}
        </CardBody>
      </HeroCard>
    );
  }

  return (
    <ListCard onClick={onCardClick} role="button" tabIndex={0}>
      <ListThumb style={renderPhotoStyle()}>
        {cafe.photo.type !== 'image' && cafe.photo.emoji}
      </ListThumb>
      <ListInfo>
        <MatchInline>{cafe.match}% Match</MatchInline>
        <CafeName>{cafe.name}</CafeName>
        <CafeMeta>{cafe.description}</CafeMeta>
        {cafe.aiReason && (
          <CardAiReason>
            <Icon name="sparkle" className="ai-icon" />
            <span>{cafe.aiReason}</span>
          </CardAiReason>
        )}
      </ListInfo>
      {onBookmarkToggle && (
        <BookmarkButton
          type="button"
          onClick={onBookmarkToggle}
          className={isBookmarked ? 'is-bookmarked' : ''}
          aria-label="북마크"
          aria-pressed={isBookmarked}
        >
          <Icon name={isBookmarked ? 'bookmarkFilled' : 'bookmark'} className="icon" />
        </BookmarkButton>
      )}
    </ListCard>
  );
};

const HeroCard = styled.article`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.card};
  cursor: pointer;
  outline: none;
  margin-bottom: ${({ theme }) => theme.space[4]};
  position: relative;
  border: 0.5px solid rgba(26, 26, 26, 0.6); // 원본 메인 헤어라인 보더 매칭
  transition: box-shadow 0.25s ease, transform 0.25s ease;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(160deg, rgba(45, 82, 68, 0.06) 0%, rgba(200, 233, 194, 0.15) 100%);
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
    z-index: 3;
    border-radius: ${({ theme }) => theme.radius.lg};
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(45, 82, 68, 0.12);
    
    &::after {
      opacity: 1;
    }
  }
`;

const HeroPhoto = styled.div`
  height: 220px;
  position: relative;
  display: flex;
  align-items: flex-end;
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.28) 100%);
    z-index: 1;
  }
`;

const MatchBadge = styled.span`
  position: absolute;
  top: ${({ theme }) => theme.space[3]};
  left: ${({ theme }) => theme.space[3]};
  z-index: 2;
  background: transparent;
  border: 0.5px solid #000000;
  color: #ffffff;
  padding: 5px 12px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: 12px;
  font-weight: 700;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
`;

const PhotoEmoji = styled.span`
  position: relative;
  z-index: 1;
  width: 100%;
  text-align: center;
  font-size: 48px;
  margin-bottom: 20px;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25));
`;

const CardBody = styled.div`
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[5]} ${({ theme }) => theme.space[5]};
`;

const TagRow = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

const Tag = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

const CafeName = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const CafeMeta = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.45;
`;

const ListCard = styled.article`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  padding: ${({ theme }) => theme.space[3]};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.shadow.card};
  cursor: pointer;
  position: relative;
  margin-bottom: ${({ theme }) => theme.space[3]};
  border: 0.5px solid #1a1a1a;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }
`;

const ListThumb = styled.div`
  width: 68px;
  height: 68px;
  border-radius: ${({ theme }) => theme.radius.sm};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
`;

const ListInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MatchInline = styled.p`
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 2px;
`;

const BookmarkButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  transition: color 0.2s, background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    color: ${({ theme }) => theme.colors.text};
  }

  &.is-bookmarked {
    color: #e2574c;
  }

  .icon {
    width: 22px;
    height: 22px;
  }
`;

const CardAiReason = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.primary};
  background: rgba(45, 82, 68, 0.08);
  border-radius: 6px;
  padding: 5px 8px;
  margin-top: 6px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-weight: 500;

  .ai-icon {
    width: 13px;
    height: 13px;
    margin-top: 2px;
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

