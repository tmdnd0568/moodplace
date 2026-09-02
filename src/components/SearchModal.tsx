import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { mockAiSearch } from '../data/mockData';
import { Icon } from './icons/Icons';
import { searchCafesWithGemini } from '../services/geminiService';

const HISTORY_KEY = 'moodplace_search_history';
const AUTOSAVE_KEY = 'moodplace_search_autosave';

const getInitialHistory = (): string[] => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : ['대전 둔산동 분위기 좋은 카페', '성수동 조용한 북카페', '말차 디저트 맛집'];
  } catch {
    return ['대전 둔산동 분위기 좋은 카페', '성수동 조용한 북카페', '말차 디저트 맛집'];
  }
};

const getInitialAutoSave = (): boolean => {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  } catch {
    return true;
  }
};

export const SearchModal: React.FC = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [isRealAiResult, setIsRealAiResult] = useState(false);
  const [isExternalRegion, setIsExternalRegion] = useState(false);
  const [targetRegion, setTargetRegion] = useState('');

  // 최근 검색어 및 자동 저장 상태
  const [searchHistory, setSearchHistory] = useState<string[]>(getInitialHistory);
  const [isAutoSaveOn, setIsAutoSaveOn] = useState<boolean>(getInitialAutoSave);

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (state.isSearchModalOpen && state.searchPhase === 'idle') {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [state.isSearchModalOpen, state.searchPhase]);

  if (!state.isSearchModalOpen) return null;

  const handleClose = () => {
    dispatch({ type: 'CLOSE_SEARCH_MODAL' });
  };

  const executeSearch = async (searchTerm: string) => {
    const query = searchTerm.trim();
    if (!query) return;

    // 검색 기록 자동 저장
    if (isAutoSaveOn) {
      setSearchHistory((prev) => {
        const filtered = prev.filter((item) => item !== query);
        const updated = [query, ...filtered].slice(0, 10);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn('[LocalStorage Error]', e);
        }
        return updated;
      });
    }

    dispatch({ type: 'START_MOOD_SEARCH' });
    try {
      const res = await searchCafesWithGemini([], query, state.cafes);
      setIsRealAiResult(res.isRealAi);
      setIsExternalRegion(!!res.isExternalRegion);
      setTargetRegion(res.targetRegion || '');
      dispatch({ type: 'RECEIVE_MOOD_SEARCH_RESULT', payload: res.cafes });
    } catch (err) {
      console.error('[Gemini Search Error]', err);
      const fallback = mockAiSearch([], query);
      dispatch({ type: 'RECEIVE_MOOD_SEARCH_RESULT', payload: fallback });
    }
  };

  const handleClearAllHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn('[LocalStorage Error]', e);
    }
  };

  const handleRemoveHistoryItem = (targetItem: string) => {
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item !== targetItem);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('[LocalStorage Error]', e);
      }
      return updated;
    });
  };

  const handleToggleAutoSave = () => {
    setIsAutoSaveOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('[LocalStorage Error]', e);
      }
      return next;
    });
  };

  const handleSelectCafe = (id: string) => {
    dispatch({ type: 'CLOSE_SEARCH_MODAL' });
    dispatch({ type: 'SELECT_CAFE', payload: id });
    navigate(`/review/${id}`);
  };

  const handleConfirmOnMain = () => {
    dispatch({ type: 'CLOSE_SEARCH_MODAL' });
  };

  const handleRestartSearch = () => {
    dispatch({ type: 'OPEN_SEARCH_MODAL' });
    setDescription('');
  };

  // 1. Loading Phase
  if (state.searchPhase === 'loading') {
    return (
      <ModalOverlay onClick={handleClose}>
        <ModalSheet onClick={(e) => e.stopPropagation()}>
          <ModalHandle onClick={handleClose} />
          <ModalLoading>
            <LoadingSpinner />
            <LoadingText>
              ✨ Gemini AI가 당신의 무드와 취향을<br />분석 중입니다...
            </LoadingText>
            <LoadingSubtext>전국 단위 맞춤 장소를 탐색하고 있어요</LoadingSubtext>
          </ModalLoading>
        </ModalSheet>
      </ModalOverlay>
    );
  }

  // 2. Result Phase (검색 완료 후 모달 페이지)
  if (state.searchPhase === 'result') {
    return (
      <ModalOverlay onClick={handleClose}>
        <ModalSheet onClick={(e) => e.stopPropagation()}>
          <ModalHandle onClick={handleClose} />
          <ResultHeader>
            <ResultLabel>
              {isExternalRegion && targetRegion
                ? `📍 "${targetRegion}" 지역 AI 실시간 추천`
                : isRealAiResult
                ? '✨ Gemini AI 맞춤 분석 추천'
                : '✨ AI 무드 추천 결과'}
            </ResultLabel>
            <ModalTitle>이런 공간은 어떠세요?</ModalTitle>
          </ResultHeader>

          <ResultList>
            {state.searchResults.map((cafe) => (
              <ResultCard
                key={cafe.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectCafe(cafe.id)}
                aria-label={`${cafe.name} 상세 보기`}
              >
                <ResultThumb
                  $image={cafe.photo.type === 'image' ? cafe.photo.image : undefined}
                  $from={cafe.photo.from}
                  $to={cafe.photo.to}
                >
                  {cafe.photo.type !== 'image' && cafe.photo.emoji}
                </ResultThumb>
                <ResultInfo>
                  <ResultMatch>{cafe.match || 95}% Match</ResultMatch>
                  <ResultName>{cafe.name}</ResultName>
                  <ResultDesc>{cafe.location} • {cafe.detail.description}</ResultDesc>
                  {cafe.aiReason && (
                    <ResultAiReason>
                      <Icon name="sparkle" className="ai-icon" />
                      <span>{cafe.aiReason}</span>
                    </ResultAiReason>
                  )}
                </ResultInfo>
                <ResultCardArrow>
                  <Icon name="chevronRight" />
                </ResultCardArrow>
              </ResultCard>
            ))}
            {state.searchResults.length === 0 && (
              <p style={{ textAlign: 'center', color: '#666', padding: '24px 0', fontSize: '13.5px' }}>
                검색 조건에 맞는 장소가 없습니다.
              </p>
            )}
          </ResultList>

          <ModalCta onClick={handleConfirmOnMain}>
            메인에서 확인하기
          </ModalCta>
          <ModalCta $outline onClick={handleRestartSearch}>
            다시 탐색하기
          </ModalCta>
        </ModalSheet>
      </ModalOverlay>
    );
  }

  // 3. Form Phase (상단에서 아래로 펼쳐지는 즉시 키보드 검색 & 최근 검색어 모달)
  return (
    <ModalOverlay onClick={handleClose}>
      <ModalSheet onClick={(e) => e.stopPropagation()}>
        <SearchTopRow>
          <SearchInputBox>
            <SearchPlusIcon>
              <Icon name="search" />
            </SearchPlusIcon>
            <TopSearchInput
              ref={inputRef}
              autoFocus
              type="text"
              placeholder="장소, 무드, 카페 Gemini AI에 검색..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  executeSearch(description);
                }
              }}
            />
            {description && (
              <ClearInputBtn type="button" onClick={() => setDescription('')} aria-label="입력 초기화">
                <Icon name="close" />
              </ClearInputBtn>
            )}
          </SearchInputBox>

          <AiModeBadgeBtn type="button" onClick={() => executeSearch(description)}>
            <Icon name="sparkle" className="ai-badge-icon" />
            <span>AI 모드</span>
          </AiModeBadgeBtn>
        </SearchTopRow>

        {/* 최근 검색어 목록 (위 이미지와 동일한 세로 수직 리스트) */}
        <HistorySection>
          <HistoryHeaderRow>
            <HistoryTitle>최근 검색 기록</HistoryTitle>
            <HistoryControls>
              <HistoryControlBtn type="button" onClick={handleToggleAutoSave}>
                {isAutoSaveOn ? '자동저장 끄기' : '자동저장 켜기'}
              </HistoryControlBtn>
              <HistoryDivider />
              <HistoryControlBtn type="button" onClick={handleClearAllHistory}>
                전체 삭제
              </HistoryControlBtn>
            </HistoryControls>
          </HistoryHeaderRow>

          {!isAutoSaveOn ? (
            <AutoSaveDisabledNotice>
              검색 기록 저장이 꺼져 있습니다.
            </AutoSaveDisabledNotice>
          ) : searchHistory.length === 0 ? (
            <EmptyHistoryText>최근 검색 기록이 없습니다.</EmptyHistoryText>
          ) : (
            <HistoryVerticalList>
              {searchHistory.map((term, index) => (
                <HistoryListRow key={`${term}-${index}`}>
                  <HistoryRowMainBtn
                    type="button"
                    onClick={() => {
                      setDescription(term);
                      executeSearch(term);
                    }}
                  >
                    <Icon name="clock" className="history-clock-icon" />
                    <HistoryTermLabel>{term}</HistoryTermLabel>
                  </HistoryRowMainBtn>
                  <HistoryRowDeleteBtn
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveHistoryItem(term);
                    }}
                    aria-label={`${term} 검색 기록 삭제`}
                  >
                    <Icon name="close" />
                  </HistoryRowDeleteBtn>
                </HistoryListRow>
              ))}
            </HistoryVerticalList>
          )}
        </HistorySection>
      </ModalSheet>
    </ModalOverlay>
  );
};

/* ─── Styled Components ─── */
const slideDown = keyframes`
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: 200;
  display: flex;
  justify-content: center;
  align-items: flex-start; /* 상단에서 아래로 드롭다운 형태로 배치 */
  padding: 16px;
  padding-top: max(16px, env(safe-area-inset-top));
  animation: ${fadeIn} 0.25s ease;
`;

const ModalSheet = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.layout.appMaxWidth};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 24px; /* 위 참고 이미지처럼 모서리 라운딩 처리 */
  padding: 16px 18px 20px 18px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
  position: relative;
  animation: ${slideDown} 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  max-height: 85vh;
  overflow-y: auto;
`;

const ModalHandle = styled.button`
  width: 44px;
  height: 5px;
  background: #d4d2cc;
  border-radius: ${({ theme }) => theme.radius.pill};
  margin: 0 auto ${({ theme }) => theme.space[4]};
  display: block;
  border: none;
  cursor: pointer;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[1]};
`;

/* ─── 참고 이미지 스타일 상단 검색 바 ─── */
const SearchTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const SearchInputBox = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.bg};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: 24px;
  padding: 0 14px;
  height: 48px;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(45, 82, 68, 0.12);
  }
`;

const SearchPlusIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-right: 8px;
  flex-shrink: 0;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const TopSearchInput = styled.input`
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  font-size: 14.5px;
  color: ${({ theme }) => theme.colors.text};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13.5px;
  }
`;

const ClearInputBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const AiModeBadgeBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(45, 82, 68, 0.08);
  color: ${({ theme }) => theme.colors.primary};
  border: 1.5px solid rgba(45, 82, 68, 0.2);
  border-radius: 20px;
  padding: 0 14px;
  height: 48px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: #ffffff;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  .ai-badge-icon {
    width: 15px;
    height: 15px;
  }
`;

/* ─── 최근 검색어 수직 리스트 (Google / Chrome 검색창 드롭다운 스타일) ─── */
const HistorySection = styled.div`
  margin-top: 8px;
`;

const HistoryHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
  margin-bottom: 4px;
`;

const HistoryTitle = styled.h4`
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const HistoryControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HistoryControlBtn = styled.button`
  background: none;
  border: none;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  padding: 2px 4px;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: underline;
  }
`;

const HistoryDivider = styled.span`
  width: 1px;
  height: 10px;
  background: ${({ theme }) => theme.colors.border};
`;

const HistoryVerticalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const HistoryListRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px;
  border-radius: 12px;
  transition: background 0.18s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
`;

const HistoryRowMainBtn = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  padding: 0;

  .history-clock-icon {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.textMuted};
    flex-shrink: 0;
  }
`;

const HistoryTermLabel = styled.span`
  font-size: 14.5px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const HistoryRowDeleteBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  transition: color 0.15s ease, background 0.15s ease;

  &:hover {
    color: #e74c3c;
    background: rgba(0, 0, 0, 0.06);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const AutoSaveDisabledNotice = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 16px 0;
  text-align: center;
`;

const EmptyHistoryText = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 16px 0;
  text-align: center;
`;

/* ─── Loading Phase ─── */
const ModalLoading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 20px;
  text-align: center;
`;

const LoadingSpinner = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 4px solid ${({ theme }) => theme.colors.primaryLight};
  border-top-color: ${({ theme }) => theme.colors.primary};
  animation: ${spin} 0.85s linear infinite;
`;

const LoadingText = styled.p`
  font-size: 14.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
`;

const LoadingSubtext = styled.p`
  font-size: 12.5px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

/* ─── Result Phase ─── */
const ResultHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.space[5]};
`;

const ResultLabel = styled.p`
  font-size: 12.5px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 4px;
`;

const ResultList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  margin-bottom: ${({ theme }) => theme.space[5]};
  max-height: 40vh;
  overflow-y: auto;
  padding-right: 4px;
`;

const ResultCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[3]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s ease, border-color 0.18s ease, transform 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    background: rgba(45, 82, 68, 0.12);
  }
`;

const ResultThumb = styled.div<{ $image?: string; $from?: string; $to?: string }>`
  width: 60px;
  height: 60px;
  border-radius: ${({ theme }) => theme.radius.sm};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  background-size: cover;
  background-position: center;
  ${({ $image, $from, $to }) =>
    $image
      ? `background-image: url('${$image}');`
      : `background-image: linear-gradient(160deg, ${$from || '#eef2f3'}, ${$to || '#8e9eab'});`}
`;

const ResultInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ResultMatch = styled.p`
  font-size: 12px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 2px;
`;

const ResultName = styled.h3`
  font-size: 15px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 2px;
`;

const ResultDesc = styled.p`
  font-size: 12.5px;
  color: ${({ theme }) => theme.colors.textMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ResultAiReason = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.primary};
  background: rgba(45, 82, 68, 0.08);
  border-radius: 6px;
  padding: 6px 9px;
  margin-top: 6px;
  line-height: 1.45;
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-weight: 500;

  .ai-icon {
    width: 13px;
    height: 13px;
    margin-top: 2px;
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.primary};
  }
`;


const ResultCardArrow = styled.div`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.15s ease, transform 0.15s ease, color 0.15s ease;

  ${ResultCard}:hover & {
    opacity: 1;
    transform: translateX(0);
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ModalCta = styled.button<{ $outline?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: ${({ $outline, theme }) => ($outline ? `1.5px solid ${theme.colors.primary}` : '0.5px solid #000000')};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ $outline }) => ($outline ? 'transparent' : '#2D5244')};
  color: ${({ $outline }) => ($outline ? '#2D5244' : '#ffffff')};
  font-size: 15.5px;
  font-weight: 700;
  padding: 14px ${({ theme }) => theme.space[5]};
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  margin-bottom: ${({ $outline }) => ($outline ? '0' : '8px')};
  box-sizing: border-box;

  &:hover {
    background: ${({ $outline }) => ($outline ? 'rgba(45, 82, 68, 0.05)' : '#1e3b30')};
  }
`;
