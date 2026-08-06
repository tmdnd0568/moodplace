import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { MY_PROFILE, ACCOUNT_MENU_ITEMS } from '../data/mockData';
import { BottomNav } from '../components/BottomNav';
import { Icon } from '../components/icons/Icons';

export const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();

  // Modals state
  const [activeModal, setActiveModal] = useState<'notifications' | 'settings' | 'editProfile' | 'privacy' | 'help' | 'logout' | null>(null);
  
  // Dynamic profile state
  const [profileName, setProfileName] = useState<string>(
    sessionStorage.getItem('moodplace_user_name') || MY_PROFILE.name
  );
  const [profileEmail, setProfileEmail] = useState<string>(
    sessionStorage.getItem('moodplace_user_email') || 'mood_lover@moodplace.com'
  );
  const [profileImage, setProfileImage] = useState<string | null>(MY_PROFILE.avatarUrl);
  const profileAvatarColor = sessionStorage.getItem('moodplace_user_avatar_color') || '';

  // Settings state
  const darkMode = state.darkMode;
  const toggleDarkMode = () => dispatch({ type: 'TOGGLE_DARK_MODE' });
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [locationEnabled, setLocationEnabled] = useState<boolean>(true);

  // Notifications list
  const [notifications, setNotifications] = useState<Array<{id: string, text: string, time: string}>>([
    { id: '1', text: '🌿 \'온화한 숲\'에 새로운 리뷰가 등록되었습니다.', time: '2시간 전' },
    { id: '2', text: '✨ 오늘의 추천 무드 장소가 갱신되었습니다.', time: '1일 전' },
    { id: '3', text: '📅 \'포레스트 인 더 시티\' 예약이 하루 남았습니다.', time: '2일 전' }
  ]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleCycleAvatar = () => {
    const list: (string | null)[] = [null, '/assets/cake_001.jpg', '/assets/tea_001.jpg', '/assets/caffe_001.jpg'];
    const currentIndex = list.indexOf(profileImage);
    const nextIndex = (currentIndex + 1) % list.length;
    setProfileImage(list[nextIndex]);
  };

  const handleBottomTabChange = (tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
    if (tabId === 'home') {
      navigate('/main');
    } else if (tabId === 'explore') {
      navigate('/find');
    } else if (tabId === 'bookmarks') {
      navigate('/keep');
    }
  };

  const handleMenuItemClick = (id: string) => {
    if (id === 'edit-profile') {
      setActiveModal('editProfile');
    } else if (id === 'notifications') {
      setActiveModal('notifications');
    } else if (id === 'privacy') {
      setActiveModal('privacy');
    } else if (id === 'support' || id === 'help') {
      setActiveModal('help');
    }
  };

  return (
    <PageContainer id="screen-my" className="screen is-active">
      {/* 1) Header */}
      <MapHeader className="my-header">
        <MapIconBtn type="button" className="my-icon-btn" onClick={handleBack} aria-label="뒤로가기">
          <Icon name="back" className="icon" />
        </MapIconBtn>
        <div className="my-header-actions">
          <MapIconBtn type="button" className="my-icon-btn" onClick={() => setActiveModal('notifications')} aria-label="알림">
            <Icon name="bell" className="icon" />
          </MapIconBtn>
          <MapIconBtn type="button" className="my-icon-btn" onClick={() => setActiveModal('settings')} aria-label="설정">
            <Icon name="settings" className="icon" />
          </MapIconBtn>
        </div>
      </MapHeader>

      {/* 2) Profile */}
      <ProfileSection className="my-profile">
        <AvatarWrap className="my-avatar-wrap">
          <AvatarDiv className="my-avatar" $image={profileImage} $avatarColor={profileAvatarColor}>
            {!profileImage && <span>{profileName.charAt(0).toUpperCase()}</span>}
          </AvatarDiv>
          <AvatarEditBtn
            type="button"
            className="my-avatar-edit-btn"
            onClick={() => setActiveModal('editProfile')}
            aria-label="프로필 사진 수정"
          >
            <Icon name="edit" className="icon" />
          </AvatarEditBtn>
        </AvatarWrap>
        <ProfileNameText className="my-name">{profileName}</ProfileNameText>
      </ProfileSection>

      {/* 3) Stats row */}
      <StatsRow className="my-stats-row">
        <StatCard className="my-stat-card">
          <StatValue className="my-stat-value">{state.bookmarkedIds.length}</StatValue>
          <StatLabel className="my-stat-label">저장</StatLabel>
        </StatCard>
        <StatCard className="my-stat-card">
          <StatValue className="my-stat-value">{MY_PROFILE.stats.reviews}</StatValue>
          <StatLabel className="my-stat-label">리뷰</StatLabel>
        </StatCard>
        <StatCard className="my-stat-card">
          <StatValue className="my-stat-value">{MY_PROFILE.stats.visits}</StatValue>
          <StatLabel className="my-stat-label">방문</StatLabel>
        </StatCard>
      </StatsRow>

      {/* 4) Account & Preferences */}
      <MenuSection className="my-section">
        <SectionLabel className="my-section-label">ACCOUNT &amp; PREFERENCES</SectionLabel>
        <MenuCard className="my-menu-card">
          {ACCOUNT_MENU_ITEMS.map((item) => (
            <MenuItemBtn
              key={item.id}
              type="button"
              className="my-menu-item"
              onClick={() => handleMenuItemClick(item.id)}
            >
              <MenuItemIcon className="my-menu-item-icon">
                <Icon name={item.icon === 'support' ? 'help' : item.icon} />
              </MenuItemIcon>
              <MenuItemLabel className="my-menu-item-label">{item.label}</MenuItemLabel>
              <MenuItemArrow className="my-menu-item-arrow">
                <Icon name="chevronRight" />
              </MenuItemArrow>
            </MenuItemBtn>
          ))}
        </MenuCard>
      </MenuSection>

      {/* 5) Logout */}
      <LogoutRow className="my-logout-row">
        <LogoutBtn type="button" className="my-logout-btn" onClick={() => setActiveModal('logout')}>
          Logout
        </LogoutBtn>
      </LogoutRow>

      {/* 6) Brand footer */}
      <BrandFooter className="my-brand-footer" aria-hidden="true">
        <div className="my-brand-badge">
          <BrandBadgeSvg viewBox="0 0 100 124" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 4C29 4 12 21 12 42c0 28 38 74 38 74s38-46 38-74C88 21 71 4 50 4z" fill="#2D5244" />
            <circle cx="50" cy="42" r="27" fill="#FFFFFF" />
            <path d="M50 29c-2.4-3.4-8-3.4-9.6 0.6-1.4 3.4 1.4 6.4 9.6 11.4 8.2-5 11-8 9.6-11.4-1.6-4-7.2-4-9.6-0.6z" fill="#2D5244" />
            <path d="M35 46h24v8a8 8 0 0 1-8 8h-8a8 8 0 0 1-8-8v-8z" fill="none" stroke="#2D5244" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M59 48h3.5a4 4 0 0 1 0 8H59" fill="none" stroke="#2D5244" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </BrandBadgeSvg>
        </div>
        <div className="my-brand-logo">
          <span className="my-brand-sub">my</span>
          <span className="my-brand-main">MoodPlace</span>
        </div>
        <p className="my-brand-tagline">
          <span className="line"></span>
          <span>당신이 분위기에 맞는 공간을 찾다</span>
          <span className="line"></span>
        </p>
      </BrandFooter>

      <BottomNav activeTab="profile" onChangeTab={handleBottomTabChange} />

      {/* --- Modals Render Area --- */}
      
      {/* 1. Notification Modal */}
      {activeModal === 'notifications' && (
        <ModalOverlay onClick={() => setActiveModal(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeaderRow>
              <ModalTitle>알림</ModalTitle>
              <CloseBtn onClick={() => setActiveModal(null)} aria-label="닫기">
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

      {/* 2. Settings Modal */}
      {activeModal === 'settings' && (
        <ModalOverlay onClick={() => setActiveModal(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeaderRow>
              <ModalTitle>설정</ModalTitle>
              <CloseBtn onClick={() => setActiveModal(null)} aria-label="닫기">
                <Icon name="close" />
              </CloseBtn>
            </ModalHeaderRow>
            <ModalScrollContent>
              <SettingsList>
                <SettingRow>
                  <SettingInfo>
                    <p className="title">다크 모드</p>
                    <p className="desc">어두운 테마로 화면을 봅니다.</p>
                  </SettingInfo>
                  <ToggleSwitch>
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={toggleDarkMode}
                    />
                    <span className="slider" />
                  </ToggleSwitch>
                </SettingRow>

                <SettingRow>
                  <SettingInfo>
                    <p className="title">푸시 알림 수신</p>
                    <p className="desc">새로운 추천 장소 및 혜택 알림을 받습니다.</p>
                  </SettingInfo>
                  <ToggleSwitch>
                    <input
                      type="checkbox"
                      checked={pushEnabled}
                      onChange={() => setPushEnabled(!pushEnabled)}
                    />
                    <span className="slider" />
                  </ToggleSwitch>
                </SettingRow>

                <SettingRow>
                  <SettingInfo>
                    <p className="title">위치 정보 이용 동의</p>
                    <p className="desc">내 주변 무드 플레이스 탐색 서비스를 이용합니다.</p>
                  </SettingInfo>
                  <ToggleSwitch>
                    <input
                      type="checkbox"
                      checked={locationEnabled}
                      onChange={() => setLocationEnabled(!locationEnabled)}
                    />
                    <span className="slider" />
                  </ToggleSwitch>
                </SettingRow>

                <VersionRow>
                  <span>앱 버전</span>
                  <span>v1.0.0 (최신 버전)</span>
                </VersionRow>
              </SettingsList>
            </ModalScrollContent>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* 3. Profile Edit Modal */}
      {activeModal === 'editProfile' && (
        <ModalOverlay onClick={() => setActiveModal(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeaderRow>
              <ModalTitle>프로필 수정</ModalTitle>
              <CloseBtn onClick={() => setActiveModal(null)} aria-label="닫기">
                <Icon name="close" />
              </CloseBtn>
            </ModalHeaderRow>
            <ModalScrollContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <EditAvatarWrap>
                <EditAvatarContainer>
                  <EditAvatar $image={profileImage}>
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" />
                    ) : (
                      <span>{profileName.charAt(0).toUpperCase()}</span>
                    )}
                  </EditAvatar>
                  <EditAvatarPenBtn
                    type="button"
                    onClick={handleCycleAvatar}
                    aria-label="프로필 이미지 수정"
                  >
                    <Icon name="edit" className="pen-icon" />
                  </EditAvatarPenBtn>
                </EditAvatarContainer>
              </EditAvatarWrap>

              <InputGroup>
                <label>이름</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="이름을 입력하세요"
                />
              </InputGroup>

              <InputGroup>
                <label>이메일</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                />
              </InputGroup>
            </ModalScrollContent>
            <ModalFooterBtn onClick={() => setActiveModal(null)}>
              저장 완료
            </ModalFooterBtn>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* 4. Privacy Modal */}
      {activeModal === 'privacy' && (
        <ModalOverlay onClick={() => setActiveModal(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeaderRow>
              <ModalTitle>개인정보 및 보안</ModalTitle>
              <CloseBtn onClick={() => setActiveModal(null)} aria-label="닫기">
                <Icon name="close" />
              </CloseBtn>
            </ModalHeaderRow>
            <ModalScrollContent>
              <PrivacySection>
                <p className="heading">개인정보 수집 동의</p>
                <p className="body">
                  my MoodPlace는 최적의 무드 카페 추천 서비스를 제공하기 위해 사용자의 관심 태그 정보를 수집합니다. 수집된 정보는 보안 서버 내에 안전하게 관리되며, 서비스 큐레이션 목적으로만 활용됩니다.
                </p>
                
                <p className="heading">비밀번호 변경 및 계정 연동</p>
                <p className="body">
                  현재 계정은 간편 카카오/이메일 로그인 연동 계정입니다. 비밀번호 분실 시 연동된 이메일 계정을 통해 재설정 링크를 받으실 수 있습니다.
                </p>
                
                <DangerZone>
                  <DangerTitle>계정 탈퇴</DangerTitle>
                  <DangerDesc>탈퇴 시 모든 예약 기록 및 저장 목록이 영구 삭제됩니다.</DangerDesc>
                  <DangerBtn onClick={() => {
                    if(confirm('정말로 탈퇴하시겠습니까? 모든 정보가 사라집니다.')) {
                      alert('그동안 이용해주셔서 감사합니다.');
                      setActiveModal(null);
                      navigate('/');
                    }
                  }}>서비스 탈퇴</DangerBtn>
                </DangerZone>
              </PrivacySection>
            </ModalScrollContent>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* 5. Help Modal */}
      {activeModal === 'help' && (
        <ModalOverlay onClick={() => setActiveModal(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeaderRow>
              <ModalTitle>문의 및 도움말</ModalTitle>
              <CloseBtn onClick={() => setActiveModal(null)} aria-label="닫기">
                <Icon name="close" />
              </CloseBtn>
            </ModalHeaderRow>
            <ModalScrollContent>
              <HelpList>
                <HelpItem>
                  <p className="q">Q. my MoodPlace는 어떤 서비스인가요?</p>
                  <p className="a">
                    그날그날 원하는 분위기(Cozy, Calm, Energetic 등)를 선택하여 감성 지도를 탐색하고, 카페 예약 및 길찾기를 일괄 진행할 수 있는 원스톱 서비스입니다.
                  </p>
                </HelpItem>
                <HelpItem>
                  <p className="q">Q. 예약 변경 및 취소 정책은?</p>
                  <p className="a">
                    예약 상세 정보 창에서 간편 취소가 가능하며, 카페 방문 시간 10분 전까지 자유롭게 취소할 수 있습니다.
                  </p>
                </HelpItem>
                <HelpItem>
                  <p className="q">Q. 1:1 고객 센터 문의 방법은?</p>
                  <p className="a">
                    이메일 support@moodplace.com 또는 고객센터 1588-Mood 로 전화주시면 신속히 답변해 드리겠습니다.
                  </p>
                </HelpItem>
              </HelpList>
            </ModalScrollContent>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* 6. Logout Modal */}
      {activeModal === 'logout' && (
        <ModalOverlay onClick={() => setActiveModal(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeaderRow>
              <ModalTitle>로그아웃</ModalTitle>
              <CloseBtn onClick={() => setActiveModal(null)} aria-label="닫기">
                <Icon name="close" />
              </CloseBtn>
            </ModalHeaderRow>
            <ModalScrollContent style={{ padding: '24px 0', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '500' }}>
                정말로 로그아웃 하시겠습니까?
              </p>
              <p style={{ fontSize: '12px', color: '#8e8c84', marginTop: '6px' }}>
                저장 정보는 기기에 계속 보존됩니다.
              </p>
            </ModalScrollContent>
            <ModalFooterRow>
              <CancelBtn onClick={() => setActiveModal(null)}>취소</CancelBtn>
              <ConfirmBtn onClick={() => {
                sessionStorage.removeItem('moodplace_auth');
                sessionStorage.removeItem('moodplace_user_email');
                sessionStorage.removeItem('moodplace_user_name');
                alert('로그아웃 되었습니다.');
                setActiveModal(null);
                navigate('/');
              }}>로그아웃</ConfirmBtn>
            </ModalFooterRow>
          </ModalCard>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

const PageContainer = styled.section`
  background: ${({ theme }) => theme.colors.bg};
  padding-bottom: calc(60px + ${({ theme }) => theme.space[6]}); /* bottom-nav-height + space-6 */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const MapHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[5]} ${({ theme }) => theme.space[2]};
`;

const MapIconBtn = styled.button`
  width: 38px;
  height: 38px;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
  }

  .icon {
    width: 21px;
    height: 21px;
  }
`;

const ProfileSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[5]} ${({ theme }) => theme.space[6]};
`;

const AvatarWrap = styled.div`
  position: relative;
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

const AvatarDiv = styled.div<{ $image: string | null; $avatarColor?: string }>`
  width: 108px;
  height: 108px;
  border-radius: 50%;
  border: 2.5px solid ${({ theme }) => theme.colors.primary};
  background: ${({ $avatarColor, theme }) => $avatarColor || theme.colors.bg};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 800;
  color: ${({ $avatarColor, theme }) => $avatarColor ? '#ffffff' : theme.colors.primary};
  ${({ $image }) => $image && `background-image: url('${$image}');`}
`;

const AvatarEditBtn = styled.button`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.colors.bg};
  background: ${({ theme }) => theme.colors.primary};
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;

  .icon {
    width: 14px;
    height: 14px;
  }
`;

const ProfileNameText = styled.p`
  font-size: 20px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
`;

const StatsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[3]};
  padding: 0 ${({ theme }) => theme.space[5]};
  margin-bottom: ${({ theme }) => theme.space[8]};
`;

const StatCard = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[2]};
  text-align: center;
  box-shadow: 0 2px 10px rgba(26, 26, 26, 0.04);
`;

const StatValue = styled.p`
  font-size: 24px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 2px;
`;

const StatLabel = styled.p`
  font-size: 12.5px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const MenuSection = styled.section`
  padding: 0 ${({ theme }) => theme.space[5]};
  margin-bottom: ${({ theme }) => theme.space[8]};
`;

const SectionLabel = styled.p`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.space[3]};
`;

const MenuCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(26, 26, 26, 0.04);
`;

const MenuItemBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[4]};
  border: none;
  background: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  text-align: left;
  transition: background 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.bg};
  }
`;

const MenuItemIcon = styled.span`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const MenuItemLabel = styled.span`
  flex: 1;
  font-size: 14.5px;
  font-weight: 600;
`;

const MenuItemArrow = styled.span`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const LogoutRow = styled.div`
  display: flex;
  justify-content: center;
  padding: 0 ${({ theme }) => theme.space[5]};
  margin-bottom: ${({ theme }) => theme.space[8]};
`;

const LogoutBtn = styled.button`
  border: none;
  background: none;
  color: #d64545;
  font-size: 14.5px;
  font-weight: 700;
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
`;

const BrandFooter = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.space[6]} ${({ theme }) => theme.space[5]} ${({ theme }) => theme.space[8]};
`;

const BrandBadgeSvg = styled.svg`
  width: 56px;
  height: 68px;
  margin-bottom: ${({ theme }) => theme.space[3]};
  display: block;
`;

// --- Modals styling ---

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 99;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.25s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalCard = styled.div`
  width: 100%;
  max-width: 600px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 24px 24px 0 0;
  padding: 24px 20px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.25s ease-out;

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
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
  color: #1a1a1a;
  border: 0.5px solid #000000;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 15.5px;
  font-weight: 700;
  margin-top: 10px;
  transition: all 0.2s ease;

  &:hover {
    background: #000000;
    color: #ffffff;
  }
`;

const ModalFooterRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 10px;
`;

const CancelBtn = styled.button`
  flex: 1;
  height: 52px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.surface};
`;

const ConfirmBtn = styled.button`
  flex: 1;
  height: 52px;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  background: #d64545;
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

const SettingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.border};
`;

const SettingInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  .title {
    font-size: 15px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
  }

  .desc {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #d4d2cc;
    transition: .3s;
    border-radius: 34px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 22px;
    width: 22px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .3s;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }

  input:checked + .slider {
    background-color: ${({ theme }) => theme.colors.primary};
  }

  input:checked + .slider:before {
    transform: translateX(22px);
  }
`;

const VersionRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 12px 0;
`;

const EditAvatarWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const EditAvatarContainer = styled.div`
  position: relative;
  width: 90px;
  height: 90px;
`;

const EditAvatar = styled.div<{ $image: string | null }>`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 1.5px solid #2D5244;
  background: #ffffff;
  color: #2D5244;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 800;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const EditAvatarPenBtn = styled.button`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #2D5244;
  color: #ffffff;
  border: 1.5px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease;

  .pen-icon {
    width: 14px;
    height: 14px;
  }

  &:hover {
    transform: scale(1.1);
  }
`;


const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
  }

  input {
    width: 100%;
    height: 46px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 8px;
    padding: 0 14px;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.bg};

    &:focus {
      border-color: ${({ theme }) => theme.colors.primary};
      outline: none;
    }
  }
`;

const PrivacySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .heading {
    font-size: 14.5px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
  }

  .body {
    font-size: 13px;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const DangerZone = styled.div`
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #ffcccc;
  background: rgba(214, 69, 69, 0.04);
  border-radius: 8px;
`;

const DangerTitle = styled.p`
  font-size: 14px;
  font-weight: 700;
  color: #d64545;
  margin-bottom: 2px;
`;

const DangerDesc = styled.p`
  font-size: 11.5px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 12px;
`;

const DangerBtn = styled.button`
  padding: 8px 16px;
  background: #d64545;
  color: #ffffff;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 700;
`;

const HelpList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const HelpItem = styled.div`
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.border};
  padding-bottom: 12px;

  &:last-child {
    border-bottom: none;
  }

  .q {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 6px;
  }

  .a {
    font-size: 13px;
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;
