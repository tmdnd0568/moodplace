import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/icons/Icons';

const MOCK_AVATARS = [
  { id: '1', label: '차분한 커피 무드', color: '#2D5244', iconName: 'coffee' },
  { id: '2', label: '따스한 채광 무드', color: '#D4A373', iconName: 'sun' },
  { id: '3', label: '감성적인 음악 무드', color: '#96A58F', iconName: 'headphones' },
  { id: '4', label: '고요한 새벽 무드', color: '#2B2D42', iconName: 'moon' },
  { id: '5', label: '특별한 별빛 무드', color: '#D08C60', iconName: 'star' },
  { id: '6', label: '자유로운 탐색 무드', color: '#4A5759', iconName: 'map' }
];

const PREFERRED_MOODS = [
  { id: 'cozy', label: '아늑한' },
  { id: 'quiet', label: '조용한' },
  { id: 'rainy', label: '비오는 날' },
  { id: 'sunny', label: '채광 가득' },
  { id: 'retro', label: '레트로/빈티지' },
  { id: 'view', label: '전망 좋은' },
  { id: 'dessert', label: '디저트 맛집' },
  { id: 'study', label: '작업/독서' }
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(sessionStorage.getItem('moodplace_user_name') || '');
  const [selectedAvatar, setSelectedAvatar] = useState('2'); // 기본 🌿
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTagToggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleComplete = () => {
    if (!nickname.trim()) {
      setError('사용하실 닉네임을 입력해 주세요.');
      return;
    }

    if (selectedTags.length === 0) {
      setError('최소 1개 이상의 선호하는 취향을 선택해 주세요.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      // 세션 스토리지 정보 동적 업데이트
      sessionStorage.setItem('moodplace_user_name', nickname.trim());
      
      // 아바타 테마 정보 가져오기
      const chosenAvatar = MOCK_AVATARS.find(a => a.id === selectedAvatar);
      if (chosenAvatar) {
        sessionStorage.setItem('moodplace_user_avatar', chosenAvatar.iconName);
        sessionStorage.setItem('moodplace_user_avatar_color', chosenAvatar.color);
      }
      
      // 선호 태그 저장
      sessionStorage.setItem('moodplace_user_tags', JSON.stringify(selectedTags));
      
      // 온보딩 완료 상태 마크
      sessionStorage.setItem('moodplace_onboarded', 'true');

      // 로컬 DB가 존재하는 경우 해당 사용자 정보에도 연동
      const userEmail = sessionStorage.getItem('moodplace_user_email');
      if (userEmail) {
        const usersData = localStorage.getItem('moodplace_users');
        if (usersData) {
          try {
            const users = JSON.parse(usersData);
            const updatedUsers = users.map((u: any) => {
              if (u.email.toLowerCase() === userEmail.toLowerCase()) {
                return { ...u, name: nickname.trim(), avatar: chosenAvatar?.iconName, tags: selectedTags };
              }
              return u;
            });
            localStorage.setItem('moodplace_users', JSON.stringify(updatedUsers));
          } catch (e) {
            console.error('로컬스토리지 사용자 정보 동기화 실패', e);
          }
        }
      }

      setIsSubmitting(false);
      navigate('/main');
    }, 1200);
  };

  return (
    <PageBg>
      <PageContainer>
        <Header>
          <LogoBadge>
            <svg viewBox="0 0 100 124" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 4C29 4 12 21 12 42c0 28 38 74 38 74s38-46 38-74C88 21 71 4 50 4z" fill="#2D5244" />
              <circle cx="50" cy="42" r="27" fill="#FFFFFF" />
              <path d="M50 29c-2.4-3.4-8-3.4-9.6 0.6-1.4 3.4 1.4 6.4 9.6 11.4 8.2-5 11-8 9.6-11.4-1.6-4-7.2-4-9.6-0.6z" fill="#2D5244" />
            </svg>
          </LogoBadge>
          <Title>프로필 설정</Title>
          <Subtitle>나만의 분위기 취향을 알려주시면<br />맞춤형 무드 플레이스를 더 잘 추천해 드려요.</Subtitle>
        </Header>

        <FormCard>
          {/* 1) 닉네임 설정 */}
          <Section>
            <Label>닉네임</Label>
            <Input
              type="text"
              placeholder="불러드릴 이름을 적어주세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={15}
            />
          </Section>

          {/* 2) 아바타 설정 */}
          <Section>
            <Label>프로필 아바타 선택</Label>
            <AvatarGrid>
              {MOCK_AVATARS.map((avatar) => (
                <AvatarBtn
                  key={avatar.id}
                  type="button"
                  $bgColor={avatar.color}
                  className={selectedAvatar === avatar.id ? 'is-selected' : ''}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  aria-label={avatar.label}
                >
                  <Icon name={avatar.iconName} className="avatar-svg-icon" />
                </AvatarBtn>
              ))}
            </AvatarGrid>
          </Section>

          {/* 3) 취향 분위기 태그 선택 */}
          <Section>
            <Label>선호하는 분위기 (다중 선택)</Label>
            <TagWrapper>
              {PREFERRED_MOODS.map((mood) => {
                const isSelected = selectedTags.includes(mood.id);
                return (
                  <TagChip
                    key={mood.id}
                    type="button"
                    className={isSelected ? 'is-active' : ''}
                    onClick={() => handleTagToggle(mood.id)}
                  >
                    <span>{mood.label}</span>
                  </TagChip>
                );
              })}
            </TagWrapper>
          </Section>

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <SubmitBtn onClick={handleComplete} disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : '설정 완료하고 시작하기'}
          </SubmitBtn>
        </FormCard>
      </PageContainer>
    </PageBg>
  );
};

/* ─── Animations ─── */
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

/* ─── Styled Components ─── */
const PageBg = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #fbfbf9 0%, #eaf6f0 50%, #f3ede6 100%);
  display: flex;
  justify-content: center;
  align-items: stretch;
`;

const PageContainer = styled.main`
  width: 100%;
  max-width: 390px;
  display: flex;
  flex-direction: column;
  padding: 44px 16px 32px;
  animation: ${fadeUp} 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 28px;
`;

const LogoBadge = styled.div`
  width: 44px;
  height: 52px;
  margin-bottom: 12px;
  svg { width: 100%; height: 100%; }
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: #666;
  line-height: 1.5;
`;

const FormCard = styled.div`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 24px;
  padding: 28px 20px;
  box-shadow: 0 10px 30px rgba(45, 82, 68, 0.05);
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  color: #333;
  margin-bottom: 10px;
  letter-spacing: -0.2px;
`;

const Input = styled.input`
  width: 100%;
  height: 48px;
  border: 1px solid #000000;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 14px;
  color: #1a1a1a;
  outline: none;
  box-sizing: border-box;

  &:focus {
    outline: none;
  }
  &::placeholder {
    color: #bbb;
  }
`;

const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
`;

const AvatarBtn = styled.button<{ $bgColor: string }>`
  height: 48px;
  border-radius: 14px;
  border: 2px solid transparent;
  background: ${({ $bgColor }) => $bgColor};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), outline 0.15s ease;

  .avatar-svg-icon {
    width: 20px;
    height: 20px;
    color: #ffffff;
  }

  &:hover {
    transform: translateY(-2px);
  }

  &.is-selected {
    transform: translateY(-2px);
    outline: 2px solid #2D5244;
    outline-offset: 2.5px;
    box-shadow: 0 4px 12px rgba(45, 82, 68, 0.25);
  }
`;

const TagWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TagChip = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #e8e5e0;
  background: #ffffff;
  font-size: 12.5px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: #fafafa;
    border-color: #cbd5e1;
  }

  &.is-active {
    background: #eaf6f0;
    border-color: #2D5244;
    color: #2D5244;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(45, 82, 68, 0.1);
  }
`;

const ErrorMsg = styled.p`
  font-size: 12.5px;
  color: #e2574c;
  margin-bottom: 14px;
  text-align: center;
  font-weight: 600;
`;

const SubmitBtn = styled.button`
  width: 100%;
  height: 52px;
  background: transparent;
  color: #000000;
  border: 1px solid #000000;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #2d5244 0%, #3e6d5a 100%);
    color: #ffffff;
    border-color: #2d5244;
    box-shadow: 0 4px 14px rgba(45, 82, 68, 0.2);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(0, 0, 0, 0.2);
  border-top-color: #000000;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;
