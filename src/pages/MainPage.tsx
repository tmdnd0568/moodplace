import React, { useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../store/StoreContext';
import { MainHeader } from '../components/MainHeader';

import { CafeCard } from '../components/CafeCard';
import { BottomNav } from '../components/BottomNav';
import { SearchModal } from '../components/SearchModal';
import { THEME_FILTERS, getCuratorMessage } from '../data/mockData';
import { Icon } from '../components/icons/Icons';
import { useNavigate } from 'react-router-dom';

export const MainPage: React.FC = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  // 오늘의 추천 아래 필터 탭용 상태 추가
  const [selectedRecommendTab, setSelectedRecommendTab] = useState<string>('all');

  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<Array<{id: string, text: string, time: string}>>([
    { id: '1', text: '🌿 \'온화한 숲\'에 새로운 리뷰가 등록되었습니다.', time: '2시간 전' },
    { id: '2', text: '✨ 오늘의 추천 무드 장소가 갱신되었습니다.', time: '1일 전' },
    { id: '3', text: '📅 \'포레스트 인 더 시티\' 예약이 하루 남았습니다.', time: '2일 전' }
  ]);



  const handleOpenSearchModal = () => {
    dispatch({ type: 'OPEN_SEARCH_MODAL' });
  };

  const handleCafeClick = (id: string) => {
    dispatch({ type: 'SELECT_CAFE', payload: id });
    navigate(`/review/${id}`);
  };

  const handleBookmarkToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_BOOKMARK', payload: id });
  };

  const handleToggleTheme = (id: string) => {
    dispatch({ type: 'TOGGLE_THEME', payload: id });
  };

  const handleBottomTabChange = (tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
    if (tabId === 'explore') {
      navigate('/find');
    } else if (tabId === 'profile') {
      navigate('/my');
    } else if (tabId === 'bookmarks') {
      navigate('/keep');
    }
  };

  const baseCafes = state.searchPhase === 'result' && state.searchResults.length > 0 
    ? state.searchResults 
    : state.cafes;

  // 오늘의 추천 하단 탭 필터링 적용
  const filteredRecommendCafes = selectedRecommendTab === 'all'
    ? baseCafes
    : baseCafes.filter(c => c.mood.includes(selectedRecommendTab));

  const heroCafe = filteredRecommendCafes[0];
  const listCafes = filteredRecommendCafes.slice(1);

  const activeMoodForCurator = selectedRecommendTab !== 'all'
    ? selectedRecommendTab
    : (state.selectedMoods.length > 0 ? state.selectedMoods[0] : 'default');

  const curatorMessage = getCuratorMessage([activeMoodForCurator]);

  const moodToCafeId: Record<string, string> = {
    default: 'forest-lounge',
    cozy: 'calm-forest',
    calm: 'urban-nest',
    energetic: 'vivid-garden',
    dreamy: 'quiet-tea-room',
  };

  const recommendedCafeId = moodToCafeId[activeMoodForCurator] || 'forest-lounge';
  const recommendedCafe = baseCafes.find(c => c.id === recommendedCafeId);

  // 추천 탭 리스트 정의
  const recommendTabs = [
    { id: 'all', label: '전체' },
    { id: 'cozy', label: 'Cozy' },
    { id: 'calm', label: 'Calm' },
    { id: 'energetic', label: 'Energetic' },
    { id: 'dreamy', label: 'Dreamy' }
  ];

  return (
    <PageContainer>
      <MainHeader onNotificationClick={() => setIsNotificationOpen(true)} hasNotification={notifications.length > 0} />
      <MainContent>
        <Headline>지금 어떤 느낌을<br />원하시나요?</Headline>

        <SearchBarButton type="button" onClick={handleOpenSearchModal}>
          <Icon name="search" className="icon-search" />
          <SearchPlaceholder>오늘은 어떤장소를 찾으시나요</SearchPlaceholder>
          <Icon name="sparkle" className="icon-sparkle" />
        </SearchBarButton>

        <RecommendSection>
          <SectionHeader>
            {state.searchPhase === 'result' ? (
              <>
                <SectionTitle>AI 탐색 결과 ({baseCafes.length})</SectionTitle>
                <SectionLink type="button" onClick={() => dispatch({ type: 'RESET_SEARCH' })}>
                  초기화
                </SectionLink>
              </>
            ) : (
              <SectionTitle>오늘의 추천</SectionTitle>
            )}
          </SectionHeader>

          {/* 추가된 추천 필터 탭창 */}
          <RecommendTabRow role="tablist" aria-label="추천 카테고리 필터">
            {recommendTabs.map((tab) => {
              const isActive = selectedRecommendTab === tab.id;
              return (
                <RecommendTabChip
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={isActive ? 'is-active' : ''}
                  onClick={() => setSelectedRecommendTab(tab.id)}
                >
                  {tab.label}
                </RecommendTabChip>
              );
            })}
          </RecommendTabRow>
          
          {heroCafe ? (
            <CafeCard
              cafe={heroCafe}
              isBookmarked={state.bookmarkedIds.includes(heroCafe.id)}
              onCardClick={() => handleCafeClick(heroCafe.id)}
              variant="hero"
            />
          ) : (
            <NoRecommend>해당 카테고리에 추천 장소가 없습니다.</NoRecommend>
          )}

          {listCafes.map((cafe) => (
            <CafeCard
              key={cafe.id}
              cafe={cafe}
              isBookmarked={state.bookmarkedIds.includes(cafe.id)}
              onCardClick={() => handleCafeClick(cafe.id)}
              onBookmarkToggle={(e) => handleBookmarkToggle(cafe.id, e)}
              variant="list"
            />
          ))}
        </RecommendSection>

        <CuratorCard>
          <CuratorIcon>
            <Icon name="sparkle" />
          </CuratorIcon>
          <CuratorBody>
            <CuratorTitle>AI 큐레이터 한마디</CuratorTitle>
            <CuratorMessage>"{curatorMessage}"</CuratorMessage>
            {recommendedCafe && (
              <CuratorLinkButton type="button" onClick={() => handleCafeClick(recommendedCafe.id)}>
                {recommendedCafe.name} 상세 정보 보기
              </CuratorLinkButton>
            )}
          </CuratorBody>
        </CuratorCard>

        <ThemeSection>
          <SectionHeader>
            <SectionTitle>테마별 탐색</SectionTitle>
          </SectionHeader>
          <ThemeGrid>
            {THEME_FILTERS.map((theme) => {
              const isSelected = state.selectedThemes.includes(theme.id);
              return (
                <ThemeCard
                  key={theme.id}
                  type="button"
                  className={isSelected ? 'is-selected' : ''}
                  onClick={() => handleToggleTheme(theme.id)}
                  aria-pressed={isSelected}
                >
                  <ThemeIconWrapper>
                    <Icon name={theme.icon} />
                  </ThemeIconWrapper>
                  <ThemeLabel>{theme.label}</ThemeLabel>
                </ThemeCard>
              );
            })}
          </ThemeGrid>
        </ThemeSection>
      </MainContent>
      
      <SearchModal />
      <BottomNav activeTab={state.activeTab} onChangeTab={handleBottomTabChange} />

      {/* --- Notification Modal Overlay --- */}
      {isNotificationOpen && (
        <ModalOverlay onClick={() => setIsNotificationOpen(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeaderRow>
              <ModalTitle>알림</ModalTitle>
              <CloseBtn onClick={() => setIsNotificationOpen(false)} aria-label="닫기">
                <Icon name="close" />
              </CloseBtn>
            </ModalHeaderRow>
            <ModalScrollContent>
              {notifications.length > 0 ? (
                <NotificationList>
                  {notifications.map((n) => (
                    <NotificationItem key={n.id}>
                      <p className="text">{n.text}</p>
                      <p className="time">{n.time}</p>
                    </NotificationItem>
                  ))}
                </NotificationList>
              ) : (
                <EmptyState>알림이 없습니다.</EmptyState>
              )}
            </ModalScrollContent>
            {notifications.length > 0 && (
              <ModalFooterBtn onClick={() => setNotifications([])}>
                전체 읽음 처리
              </ModalFooterBtn>
            )}
          </ModalCard>
        </ModalOverlay>
      )}


    </PageContainer>
  );
};

const PageContainer = styled.section`
  background: ${({ theme }) => theme.colors.bg};
  padding-bottom: calc(84px + env(safe-area-inset-bottom));
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  box-sizing: border-box;
`;

const MainContent = styled.div`
  padding: ${({ theme }) => theme.space[5]} ${({ theme }) => theme.space[5]} 0;
`;

const Headline = styled.h1`
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 24px;
  font-weight: 300;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.35;
  margin: ${({ theme }) => theme.space[2]} 0 ${({ theme }) => theme.space[5]};
  letter-spacing: -0.3px;
`;



const SearchBarButton = styled.button`
  width: 100%;
  height: 58px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  display: flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.space[4]};
  margin-bottom: ${({ theme }) => theme.space[6]};
  text-align: left;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primaryLight};
  }

  .icon-search {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.textMuted};
    margin-right: ${({ theme }) => theme.space[2]};
  }

  .icon-sparkle {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.primary};
    margin-left: auto;
  }
`;

const SearchPlaceholder = styled.span`
  font-size: 14px;
  color: #a4a29e;
`;

const RecommendSection = styled.section`
  margin-bottom: ${({ theme }) => theme.space[6]};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end; /* 제목과 링크의 베이스라인을 정확히 일치시킵니다 */
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space[4]}; /* 가독성을 위한 숨통(16px) 트임 */
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.1;
`;

const SectionLink = styled.button`
  font-size: 18px; /* 세련된 삼점식(···) 비주얼을 위해 폰트 크기 업 */
  font-weight: 800;
  letter-spacing: 1px;
  color: ${({ theme }) => theme.colors.textMuted};
  background: transparent;
  border: none;
  cursor: pointer;
  line-height: 1;
  padding: 4px 8px; /* 호버 감지 편의를 위한 패딩 확보 */
  margin-right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    transform: scale(1.1);
  }
`;

const RecommendTabRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 4px;
  margin-bottom: ${({ theme }) => theme.space[4]};
  padding-bottom: 2px;
`;

const RecommendTabChip = styled.button`
  flex: 1;
  min-width: 0;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease;
  cursor: pointer;

  &.is-active {
    background: transparent;
    border: 1px solid #1a1a1a;
    color: ${({ theme }) => theme.colors.text};
    font-weight: 700;
  }
`;

const NoRecommend = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  padding: 40px 0;
`;

const CuratorCard = styled.section`
  background: #f1f4f0;
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.space[4]};
  display: flex;
  gap: ${({ theme }) => theme.space[3]};
  margin-bottom: ${({ theme }) => theme.space[6]};
  border: 1px solid #e2ebd9;
`;

const CuratorIcon = styled.div`
  width: 24px;
  height: 24px;
  color: ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
  
  svg {
    width: 100%;
    height: 100%;
  }
`;

const CuratorBody = styled.div`
  flex: 1;
`;

const CuratorTitle = styled.p`
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryDark};
  margin-bottom: 2px;
`;

const CuratorMessage = styled.p`
  font-size: 13px;
  color: #3b4e43;
  line-height: 1.45;
`;

const CuratorLinkButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 13px;
  font-weight: 700;
  padding: 0;
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ThemeSection = styled.section`
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

const ThemeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.space[3]};
`;

const ThemeCard = styled.button`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.space[4]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  align-items: flex-start;
  text-align: left;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: ${({ theme }) => theme.shadow.card};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primaryLight};
  }

  &.is-selected {
    background: ${({ theme }) => theme.colors.primaryLight};
    border-color: ${({ theme }) => theme.colors.primary};
    
    span {
      color: ${({ theme }) => theme.colors.primaryDark};
    }
  }
`;

const ThemeIconWrapper = styled.span`
  width: 22px;
  height: 22px;
  color: ${({ theme }) => theme.colors.textMuted};
  
  svg {
    width: 100%;
    height: 100%;
  }
`;

const ThemeLabel = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

// --- Notification Modal styling ---

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: ${({ theme }) => theme.layout.appMaxWidth || '403px'};
  background: rgba(0, 0, 0, 0.45);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.25s ease-out;
  box-sizing: border-box;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalCard = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 20px;
  padding: 24px 20px;
  max-height: 80vh;
  max-height: 80dvh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
  animation: popCenter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  box-sizing: border-box;

  @keyframes popCenter {
    from { transform: scale(0.92); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

const ModalHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  font-size: 19px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
`;

const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const ModalScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ModalFooterBtn = styled.button`
  width: 100%;
  height: 52px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  border: 0.5px solid ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 15.5px;
  font-weight: 700;
  margin-top: 10px;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.text};
    color: ${({ theme }) => theme.colors.surface};
  }
`;

const NotificationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const NotificationItem = styled.div`
  padding: 14px;
  background: ${({ theme }) => theme.colors.bg};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 0.5px solid ${({ theme }) => theme.colors.border};

  .text {
    font-size: 13.5px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 4px;
  }

  .time {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const EmptyState = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  padding: 40px 0;
`;

