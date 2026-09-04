import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { SAVED_PLACES, SAVED_CATEGORY_FILTERS } from '../data/mockData';
import { BottomNav } from '../components/BottomNav';
import { Icon } from '../components/icons/Icons';

export const KeepPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();

  const handleGoToProfile = () => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'profile' });
    navigate('/my');
  };

  const handleSetFilter = (filterId: string) => {
    dispatch({ type: 'SET_SAVED_FILTER', payload: filterId });
  };

  const handleUnsavePlace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_BOOKMARK', payload: id });
  };

  const handleBottomTabChange = (tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
    if (tabId === 'home') {
      navigate('/main');
    } else if (tabId === 'explore') {
      navigate('/find');
    } else if (tabId === 'profile') {
      navigate('/my');
    }
  };

  const handleCardClick = (id: string) => {
    dispatch({ type: 'SELECT_CAFE', payload: id });
    navigate(`/review/${id}`);
  };

  const savedPlaces = SAVED_PLACES.filter((place) => state.bookmarkedIds.includes(place.id));
  const visiblePlaces =
    state.savedFilterCategory === 'all'
      ? savedPlaces
      : savedPlaces.filter((place) => place.category === state.savedFilterCategory);

  return (
    <PageContainer>
      <KeepHeader>
        <KeepLogo>
          <LogoImg src="/assets/logo_01.png" alt="MoodPlace" />
        </KeepLogo>
        <KeepAvatarBtn type="button" onClick={handleGoToProfile} aria-label="마이페이지로 이동">
          <Icon name="user" className="icon" />
        </KeepAvatarBtn>
      </KeepHeader>

      <KeepTitleSection>
        <KeepTitle>저장한 장소</KeepTitle>
        <KeepSubtitle>당신이 영감을 받았던 공간들을 확인해보세요.</KeepSubtitle>
      </KeepTitleSection>

      <KeepFilterRow role="tablist" aria-label="카테고리 필터">
        {SAVED_CATEGORY_FILTERS.map((filter) => {
          const isActive = filter.id === state.savedFilterCategory;
          return (
            <KeepFilterChip
              key={filter.id}
              type="button"
              className={isActive ? 'is-active' : ''}
              onClick={() => handleSetFilter(filter.id)}
              role="tab"
              aria-selected={isActive}
            >
              {filter.label}
            </KeepFilterChip>
          );
        })}
      </KeepFilterRow>

      <ContentScroll>
        {visiblePlaces.length > 0 ? (
          <KeepList>
            {visiblePlaces.map((place) => (
              <KeepCard key={place.id} onClick={() => handleCardClick(place.id)}>
                <KeepCardThumb style={{ backgroundImage: `url(${place.image})` }} />
                <KeepCardInfo>
                  <KeepCardName>{place.name}</KeepCardName>
                  <KeepCardAddress>{place.address}</KeepCardAddress>
                  <KeepCardTagRow>
                    {place.tags.map((tag, idx) => (
                      <KeepTag key={idx} className={idx % 2 === 0 ? 'pink' : 'teal'}>
                        {tag}
                      </KeepTag>
                    ))}
                  </KeepCardTagRow>
                </KeepCardInfo>
                <KeepHeartBtn
                  type="button"
                  onClick={(e) => handleUnsavePlace(place.id, e)}
                  aria-label="저장 해제"
                >
                  <Icon name="heartFilled" className="icon" />
                </KeepHeartBtn>
              </KeepCard>
            ))}
          </KeepList>
        ) : (
          <KeepEmpty>
            아직 저장한 장소가 없어요.<br />마음에 드는 공간을 하트로 저장해보세요.
          </KeepEmpty>
        )}
      </ContentScroll>

      <BottomNav activeTab="bookmarks" onChangeTab={handleBottomTabChange} />
    </PageContainer>
  );
};

const PageContainer = styled.section`
  background: ${({ theme }) => theme.colors.bg};
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: calc(84px + env(safe-area-inset-bottom));
  box-sizing: border-box;
`;

const KeepHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[5]};
  background: ${({ theme }) => theme.colors.bg};
  position: sticky;
  top: 0;
  z-index: 5;
`;

const KeepLogo = styled.div`
  display: flex;
  align-items: center;
  line-height: 1.1;
`;

const LogoImg = styled.img`
  height: 48px;
  max-height: 52px;
  width: auto;
  object-fit: contain;
  margin-left: -13px;
`;

const KeepAvatarBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ theme }) => theme.shadow.card};
  
  .icon {
    width: 20px;
    height: 20px;
  }
`;

const KeepTitleSection = styled.section`
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[5]} ${({ theme }) => theme.space[1]};
`;

const KeepTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const KeepSubtitle = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const KeepFilterRow = styled.div`
  display: flex;
  gap: 0;
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[5]} 0;
  box-sizing: border-box;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

const KeepFilterChip = styled.button`
  flex: 1;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  transition: color 0.2s ease, border-bottom-color 0.2s ease;
  cursor: pointer;
  padding: 0;

  &.is-active {
    border-bottom: 2px solid ${({ theme }) => theme.colors.text};
    color: ${({ theme }) => theme.colors.text};
    font-weight: 700;
  }

  &:hover:not(.is-active) {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ContentScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 ${({ theme }) => theme.space[5]} ${({ theme }) => theme.space[4]};
`;

const KeepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

const KeepCard = styled.article`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.space[3]};
  box-shadow: ${({ theme }) => theme.shadow.card};
  position: relative;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }
`;

const KeepCardThumb = styled.div`
  width: 68px;
  height: 68px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
`;

const KeepCardInfo = styled.div`
  flex: 1;
  margin-left: ${({ theme }) => theme.space[3]};
  min-width: 0;
  padding-right: ${({ theme }) => theme.space[6]};
`;

const KeepCardName = styled.p`
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 2px;
`;

const KeepCardAddress = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.space[2]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const KeepCardTagRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[1]};
`;

const KeepTag = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-weight: 500;

  &.pink {
    background: #fff0f0;
    color: #e2574c;
  }
  &.teal {
    background: #f0f7f4;
    color: #2d5244;
  }
`;

const KeepHeartBtn = styled.button`
  position: absolute;
  right: ${({ theme }) => theme.space[3]};
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e2574c;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: #fff0f0;
  }

  .icon {
    width: 20px;
    height: 20px;
  }
`;

const KeepEmpty = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  padding: 80px 0;
  line-height: 1.6;
`;
