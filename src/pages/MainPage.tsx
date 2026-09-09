import React, { useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../store/StoreContext';
import { MainHeader } from '../components/MainHeader';

import { CafeCard } from '../components/CafeCard';
import { BottomNav } from '../components/BottomNav';
import { SearchModal } from '../components/SearchModal';
import { THEME_FILTERS, getCuratorMessage, MAP_ORIGIN_LABEL, mockAiSearch } from '../data/mockData';
import { searchCafesWithGemini } from '../services/geminiService';
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



  const handleResetSearch = () => {
    setSelectedRecommendTab('all');
    dispatch({ type: 'RESET_SEARCH' });
    dispatch({ type: 'SHOW_TOAST', payload: '검색 및 필터가 초기화되었습니다.' });
    setTimeout(() => {
      dispatch({ type: 'HIDE_TOAST' });
    }, 1800);
  };

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

  const handleThemeClick = async (theme: typeof THEME_FILTERS[0]) => {
    dispatch({ type: 'TOGGLE_THEME', payload: theme.id });

    const locationText = MAP_ORIGIN_LABEL || '현재 위치(서울시 종로구)';
    const query = `${locationText} 근처 ${theme.label} 분위기의 추천 공간`;

    dispatch({ type: 'START_MOOD_SEARCH' });
    try {
      const res = await searchCafesWithGemini([], query, state.cafes);
      dispatch({ type: 'RECEIVE_MOOD_SEARCH_RESULT', payload: res.cafes });
      setSelectedRecommendTab('all');
      dispatch({
        type: 'SHOW_TOAST',
        payload: `✨ '${theme.label}' 테마 AI 위치 탐색 완료!`,
      });
      setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 2000);

      const recommendElem = document.getElementById('recommend-section');
      if (recommendElem) {
        recommendElem.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error('[Theme AI Search Error]', err);
      const fallback = mockAiSearch([], query);
      dispatch({ type: 'RECEIVE_MOOD_SEARCH_RESULT', payload: fallback });
    }
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

        <RecommendSection id="recommend-section">
          <SectionHeader>
            <SectionTitle>
              오늘의 추천
              {state.searchPhase === 'result' && <AiResultTag>AI 검색 결과</AiResultTag>}
            </SectionTitle>
            <ResetButton type="button" onClick={handleResetSearch} title="Reset AI search and filters" aria-label="초기화">
              <Icon name="reset" />
            </ResetButton>
          </SectionHeader>

          {state.searchPhase === 'loading' && (
            <AiSearchingBanner>
              <AiLoadingDot />
              <span>{MAP_ORIGIN_LABEL} 기반 AI 위치 탐색 중...</span>
            </AiSearchingBanner>
          )}

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
                  onClick={() => handleThemeClick(theme)}
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
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.1;
`;

const ResetButton = styled.button`
  background: transparent;
  border: none;
  padding: 4px;
  margin-right: 20px; /* 하단 5번째 탭(Dreamy) 텍스트와 우측 위치 수직 정렬 일치 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted || '#8e8c89'};
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.25s ease;

  svg {
    width: 18px;
    height: 18px;
    stroke: ${({ theme }) => theme.colors.textMuted || '#8e8c89'};
    transition: transform 0.35s ease, stroke 0.2s ease;
  }

  &:hover {
    color: #2d5244;
    background: rgba(45, 82, 68, 0.08);

    svg {
      stroke: #2d5244;
      transform: rotate(-180deg);
    }
  }

  &:active {
    transform: scale(0.9);
  }
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
  width: 100%;
  gap: 0;
  margin-bottom: ${({ theme }) => theme.space[4]};
  padding: 0;
`;

const RecommendTabChip = styled.button`
  flex: 1;
  min-width: 0;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: color 0.2s ease, border-bottom-color 0.2s ease;
  cursor: pointer;
  padding: 0;

  &.is-active {
    background: transparent;
    border-bottom: 2px solid ${({ theme }) => theme.colors.text};
    color: ${({ theme }) => theme.colors.text};
    font-weight: 700;
  }

  &:hover:not(.is-active) {
    color: ${({ theme }) => theme.colors.text};
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

const AiResultTag = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #2d5244;
  background: #e8f0ec;
  border: 1px solid #b8d4c8;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
  vertical-align: middle;
`;

const AiSearchingBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f4efea;
  border: 1px solid #e0dad3;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  color: #4a5568;
  margin-bottom: 16px;
`;

const AiLoadingDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2d5244;
  animation: pulse 1s infinite alternate;

  @keyframes pulse {
    0% { transform: scale(0.8); opacity: 0.5; }
    100% { transform: scale(1.2); opacity: 1; }
  }
`;

