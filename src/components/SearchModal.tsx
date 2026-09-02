import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { MOOD_TAGS, mockAiSearch } from '../data/mockData';
import { Icon } from './icons/Icons';
import { searchCafesWithGemini } from '../services/geminiService';

export const SearchModal: React.FC = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [isRealAiResult, setIsRealAiResult] = useState(false);
  const [isExternalRegion, setIsExternalRegion] = useState(false);
  const [targetRegion, setTargetRegion] = useState('');

  if (!state.isSearchModalOpen) return null;

  const handleClose = () => {
    dispatch({ type: 'CLOSE_SEARCH_MODAL' });
  };

  const handleToggleMood = (id: string) => {
    dispatch({ type: 'TOGGLE_MODAL_MOOD', payload: id });
  };

  const handleSearch = async () => {
    dispatch({ type: 'START_MOOD_SEARCH' });
    try {
      const res = await searchCafesWithGemini(
        state.modalSelectedMoods,
        description,
        state.cafes
      );
      setIsRealAiResult(res.isRealAi);
      setIsExternalRegion(!!res.isExternalRegion);
      setTargetRegion(res.targetRegion || '');
      dispatch({ type: 'RECEIVE_MOOD_SEARCH_RESULT', payload: res.cafes });
    } catch (err) {
      console.error('[Gemini Search Error]', err);
      const fallback = mockAiSearch(state.modalSelectedMoods, description);
      dispatch({ type: 'RECEIVE_MOOD_SEARCH_RESULT', payload: fallback });
    }
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

  const hasMood = state.modalSelectedMoods.length > 0;
  const hasDescription = description.trim().length > 0;
  const canSearch = hasMood || hasDescription;

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

  // 3. Form Phase (검색 입력 모달 페이지)
  return (
    <ModalOverlay onClick={handleClose}>
      <ModalSheet onClick={(e) => e.stopPropagation()}>
        <ModalHandle onClick={handleClose} />
        <ModalTitle>지금 어떤 느낌을 원하시나요?</ModalTitle>
        <ModalSubtitle>AI가 당신의 취향에 맞는 완벽한 공간을 찾아드려요.</ModalSubtitle>

        <ModalSection>
          <ModalLabel>오늘의 무드 선택</ModalLabel>
          <MoodGrid role="group" aria-label="오늘의 무드 선택">
            {MOOD_TAGS.map((mood) => {
              const isActive = state.modalSelectedMoods.includes(mood.id);
              return (
                <ModalMoodChip
                  key={mood.id}
                  type="button"
                  className={isActive ? 'is-active' : ''}
                  onClick={() => handleToggleMood(mood.id)}
                  aria-pressed={isActive}
                >
                  {mood.label}
                </ModalMoodChip>
              );
            })}
          </MoodGrid>
        </ModalSection>

        <ModalSection>
          <ModalLabel>상세한 분위기 설명 (선택)</ModalLabel>
          <SearchTextarea
            placeholder="예: '조용히 책 읽기 좋은 성수동 카페', '재즈 음악이 흐르고 채광이 가득한 따뜻한 공간'"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </ModalSection>

        <SearchButton
          type="button"
          disabled={!canSearch}
          onClick={handleSearch}
        >
          <span>무드 플레이스 탐색하기</span>
          <Icon name="sparkle" className="icon" />
        </SearchButton>
      </ModalSheet>
    </ModalOverlay>
  );
};

/* ─── Styled Components ─── */
const slideUp = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
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
  background: ${({ theme }) => theme.colors.overlay};
  z-index: 200;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  animation: ${fadeIn} 0.3s ease;
`;

const ModalSheet = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.layout.appMaxWidth};
  background: ${({ theme }) => theme.colors.surface};
  border-top-left-radius: ${({ theme }) => theme.radius.lg};
  border-top-right-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[6]};
  padding-bottom: calc(env(safe-area-inset-bottom) + ${({ theme }) => theme.space[6]});
  box-shadow: ${({ theme }) => theme.shadow.float};
  position: relative;
  animation: ${slideUp} 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  max-height: 88vh;
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

const ModalSubtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.space[5]};
  line-height: 1.5;
`;

const ModalSection = styled.div`
  margin-bottom: ${({ theme }) => theme.space[5]};
`;

const ModalLabel = styled.p`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[3]};
`;

const MoodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.space[2]};
`;

const ModalMoodChip = styled.button`
  height: 48px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[2]};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  background: transparent;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primaryLight};
  }

  &.is-active {
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    color: #ffffff;
  }
`;


const SearchTextarea = styled.textarea`
  width: 100%;
  height: 100px;
  padding: ${({ theme }) => theme.space[3]};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bg};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  resize: none;
  line-height: 1.5;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
  }
`;

const SearchButton = styled.button`
  width: 100%;
  height: 52px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[2]};
  transition: opacity 0.2s;
  border: none;
  cursor: pointer;

  &:disabled {
    background: #dfdeda;
    color: #a4a29e;
    cursor: not-allowed;
  }

  .icon {
    width: 16px;
    height: 16px;
  }
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
