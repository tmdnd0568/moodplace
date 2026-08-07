import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';

// 가상 사용자 데이터 모델 인터페이스
interface User {
  email: string;
  password: string;
  name: string;
}

const DEFAULT_USERS: User[] = [
  { email: 'admin@moodplace.com', password: 'password123', name: '관리자' }
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 페이지 뷰 모드: login (로그인), signup (회원가입), find-password (비번 찾기), find-password-reset (비번 재설정)
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'find-password' | 'find-password-reset'>('login');
  
  // 공통 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 1) 로그인 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 2) 회원가입 폼 상태
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpPasswordConfirm, setSignUpPasswordConfirm] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [isSignUpSuccess, setIsSignUpSuccess] = useState(false);

  // 3) 비밀번호 찾기 및 재설정 폼 상태
  const [findEmail, setFindEmail] = useState('');
  const [findError, setFindError] = useState('');
  const [targetUserEmail, setTargetUserEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  // 4) 소셜 로그인용 모달 상태
  const [socialModalType, setSocialModalType] = useState<'google' | 'kakao' | 'apple' | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);

  // LocalStorage 사용자 DB 초기화 및 헬퍼 함수
  const getUsers = (): User[] => {
    const data = localStorage.getItem('moodplace_users');
    if (!data) {
      localStorage.setItem('moodplace_users', JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_USERS;
    }
  };

  // 일반 로그인 핸들러
  const handleLogin = () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setIsLoading(true);

    setTimeout(() => {
      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      
      if (!user) {
        setError('가입되지 않은 이메일 주소입니다.');
        setIsLoading(false);
        return;
      }
      
      if (user.password !== password) {
        setError('비밀번호가 올바르지 않습니다.');
        setIsLoading(false);
        return;
      }

      const hasOnboarded = (user as any).tags && (user as any).tags.length > 0;
      sessionStorage.setItem('moodplace_auth', 'true');
      sessionStorage.setItem('moodplace_user_email', user.email);
      sessionStorage.setItem('moodplace_user_name', user.name);
      
      setIsLoading(false);
      if (hasOnboarded) {
        sessionStorage.setItem('moodplace_onboarded', 'true');
        navigate('/main');
      } else {
        navigate('/onboarding');
      }
    }, 900);
  };

  // 회원가입 핸들러
  const handleSignUp = () => {
    setSignUpError('');
    if (!signUpEmail.trim() || !signUpPassword || !signUpPasswordConfirm || !signUpName.trim()) {
      setSignUpError('모든 정보를 정확하게 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpEmail.trim())) {
      setSignUpError('유효한 이메일 형식이 아닙니다.');
      return;
    }

    if (signUpPassword.length < 6) {
      setSignUpError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (signUpPassword !== signUpPasswordConfirm) {
      setSignUpError('비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const users = getUsers();
      const exists = users.some(u => u.email.toLowerCase() === signUpEmail.trim().toLowerCase());
      
      if (exists) {
        setSignUpError('이미 사용 중인 이메일 주소입니다.');
        setIsLoading(false);
        return;
      }

      const newUser: User = {
        email: signUpEmail.trim(),
        password: signUpPassword,
        name: signUpName.trim()
      };

      const updatedUsers = [...users, newUser];
      localStorage.setItem('moodplace_users', JSON.stringify(updatedUsers));
      
      setIsLoading(false);
      setIsSignUpSuccess(true);

      // 1.5초 후 자동 로그인 및 온보딩 페이지 이동
      setTimeout(() => {
        sessionStorage.setItem('moodplace_auth', 'true');
        sessionStorage.setItem('moodplace_user_email', newUser.email);
        sessionStorage.setItem('moodplace_user_name', newUser.name);
        setIsSignUpSuccess(false);
        navigate('/onboarding');
      }, 1500);
    }, 1000);
  };

  // 비밀번호 찾기(이메일 확인) 핸들러
  const handleFindPassword = () => {
    setFindError('');
    if (!findEmail.trim()) {
      setFindError('이메일 주소를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === findEmail.trim().toLowerCase());
      
      if (!user) {
        setFindError('등록되지 않은 이메일 주소입니다.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setTargetUserEmail(user.email);
      setCurrentView('find-password-reset');
    }, 1000);
  };

  // 비밀번호 재설정 핸들러
  const handleResetPassword = () => {
    setResetError('');
    if (!resetPassword || !resetPasswordConfirm) {
      setResetError('비밀번호를 입력해주세요.');
      return;
    }

    if (resetPassword.length < 6) {
      setResetError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (resetPassword !== resetPasswordConfirm) {
      setResetError('비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const users = getUsers();
      const updatedUsers = users.map(u => {
        if (u.email.toLowerCase() === targetUserEmail.toLowerCase()) {
          return { ...u, password: resetPassword };
        }
        return u;
      });

      localStorage.setItem('moodplace_users', JSON.stringify(updatedUsers));
      setIsLoading(false);
      setIsResetSuccess(true);

      // 1.5초 후 재설정 완료 처리 및 로그인 화면으로 리다이렉트
      setTimeout(() => {
        setIsResetSuccess(false);
        setCurrentView('login');
        // 필드 초기화
        setResetPassword('');
        setResetPasswordConfirm('');
        setFindEmail('');
      }, 1500);
    }, 1000);
  };

  // 소셜 로그인 처리 (모사)
  const handleSocialSelect = (socialName: string, selectedEmail: string, selectedName: string) => {
    console.log(`Logging in with ${socialName}`);
    setSocialLoading(true);
    setTimeout(() => {
      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === selectedEmail.toLowerCase());
      
      sessionStorage.setItem('moodplace_auth', 'true');
      sessionStorage.setItem('moodplace_user_email', selectedEmail);
      sessionStorage.setItem('moodplace_user_name', selectedName);
      
      const hasOnboarded = user && (user as any).tags && (user as any).tags.length > 0;
      
      setSocialLoading(false);
      setSocialModalType(null);
      if (hasOnboarded) {
        sessionStorage.setItem('moodplace_onboarded', 'true');
        navigate('/main');
      } else {
        if (!user) {
          const newUser: User = {
            email: selectedEmail,
            password: 'social-auth-placeholder-pass',
            name: selectedName
          };
          localStorage.setItem('moodplace_users', JSON.stringify([...users, newUser]));
        }
        navigate('/onboarding');
      }
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') action();
  };

  return (
    <PageBg>
      <PageContainer>
        {/* 상단 브랜드 영역 */}
        <BrandSection>
          <BrandLogoImg src="/assets/logo_01.png" alt="MoodPlace" />

          <Tagline>
            <TagLine />
            <TagText>당신이 분위기에 맞는 공간을 찾다</TagText>
            <TagLine />
          </Tagline>
        </BrandSection>

        {/* ─── 1) 로그인 뷰 ─── */}
        {currentView === 'login' && (
          <FormCard>
            <CardTitle>로그인</CardTitle>
            <FieldGroup>
              <Label htmlFor="login-email">ID (EMAIL)</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="email@moodplace.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleLogin)}
                autoComplete="email"
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="login-password">PASSWORD</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleLogin)}
                autoComplete="current-password"
              />
            </FieldGroup>

            {error && <ErrorMsg role="alert">{error}</ErrorMsg>}

            <LoginBtn
              id="login-submit"
              type="button"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? <Spinner /> : 'LOG IN'}
            </LoginBtn>

            <Divider>
              <DivLine />
              <DivText>또는 소셜 로그인</DivText>
              <DivLine />
            </Divider>

            <SocialRow>
              <SocialBtn id="login-google" type="button" onClick={() => setSocialModalType('google')} aria-label="구글로 로그인">
                <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.7 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-8 19.6-20 0-1.3-.1-2.7-.4-4H43.6z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.7 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5L31.5 34C29.7 35.3 27 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.2C9.4 38.7 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.3 5.4l6 5C40.9 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-4z" />
                </svg>
              </SocialBtn>

              <SocialBtn id="login-kakao" type="button" $bgColor="#FEE500" onClick={() => setSocialModalType('kakao')} aria-label="카카오로 로그인">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 3C6.477 3 2 6.477 2 10.8c0 2.79 1.643 5.24 4.126 6.727L5.1 21l4.5-2.3c.78.15 1.576.23 2.4.23 5.523 0 10-3.477 10-7.8C22 6.477 17.523 3 12 3z"
                    fill="#3C1E1E"
                  />
                  <path
                    d="M8.5 13.5L9.8 9.8l2.2 3.1 2.2-3.1 1.3 3.7"
                    fill="none"
                    stroke="#FEE500"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </SocialBtn>

              <SocialBtn id="login-apple" type="button" $bgColor="#000" onClick={() => setSocialModalType('apple')} aria-label="애플로 로그인">
                <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#fff" d="M34.5 25.8c0-4.9 4-7.2 4.2-7.4-2.3-3.3-5.8-3.8-7.1-3.8-3-.3-5.9 1.8-7.4 1.8-1.5 0-3.8-1.7-6.3-1.7-3.2 0-6.2 1.9-7.8 4.8-3.4 5.8-.9 14.4 2.4 19.1 1.6 2.3 3.5 4.9 6 4.8 2.4-.1 3.3-1.5 6.2-1.5s3.7 1.5 6.3 1.5 4.2-2.3 5.8-4.6 2.2-4.7 2.2-4.8c-.1 0-4.5-1.8-4.5-7.2zm-4.2-13.3c1.3-1.6 2.2-3.8 2-6-1.9.1-4.2 1.3-5.6 2.9-1.2 1.4-2.3 3.7-2 5.9 2.1.1 4.3-1.1 5.6-2.8z"/>
                </svg>
              </SocialBtn>
            </SocialRow>
          </FormCard>
        )}

        {/* ─── 2) 회원가입 뷰 ─── */}
        {currentView === 'signup' && (
          <FormCard>
            <CardTitle>회원가입</CardTitle>
            {isSignUpSuccess ? (
              <SuccessWrap>
                <SuccessCircle>✓</SuccessCircle>
                <SuccessTitle>회원가입 완료!</SuccessTitle>
                <SuccessDesc>반갑습니다, {signUpName}님!<br />곧 가입하신 계정으로 자동 로그인됩니다.</SuccessDesc>
              </SuccessWrap>
            ) : (
              <>
                <FieldGroup>
                  <Label htmlFor="signup-name">이름 (NICKNAME)</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="홍길동"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleSignUp)}
                  />
                </FieldGroup>

                <FieldGroup>
                  <Label htmlFor="signup-email">이메일 주소</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleSignUp)}
                  />
                </FieldGroup>

                <FieldGroup>
                  <Label htmlFor="signup-password">비밀번호</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="최소 6자 이상"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleSignUp)}
                  />
                </FieldGroup>

                <FieldGroup>
                  <Label htmlFor="signup-password-confirm">비밀번호 확인</Label>
                  <Input
                    id="signup-password-confirm"
                    type="password"
                    placeholder="비밀번호 재입력"
                    value={signUpPasswordConfirm}
                    onChange={(e) => setSignUpPasswordConfirm(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleSignUp)}
                  />
                </FieldGroup>

                {signUpError && <ErrorMsg role="alert">{signUpError}</ErrorMsg>}

                <LoginBtn
                  type="button"
                  onClick={handleSignUp}
                  disabled={isLoading}
                >
                  {isLoading ? <Spinner /> : '가입하기'}
                </LoginBtn>

                <CardLinkRow>
                  <CardLink type="button" onClick={() => { setCurrentView('login'); setSignUpError(''); }}>
                    이미 계정이 있으신가요? 로그인
                  </CardLink>
                </CardLinkRow>
              </>
            )}
          </FormCard>
        )}

        {/* ─── 3) 비밀번호 찾기 뷰 ─── */}
        {currentView === 'find-password' && (
          <FormCard>
            <CardTitle>비밀번호 찾기</CardTitle>
            <FieldGroup>
              <Label htmlFor="find-email">가입한 이메일 주소</Label>
              <Input
                id="find-email"
                type="email"
                placeholder="registered@email.com"
                value={findEmail}
                onChange={(e) => setFindEmail(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleFindPassword)}
              />
            </FieldGroup>

            {findError && <ErrorMsg role="alert">{findError}</ErrorMsg>}

            <LoginBtn
              type="button"
              onClick={handleFindPassword}
              disabled={isLoading}
            >
              {isLoading ? <Spinner /> : '이메일 확인'}
            </LoginBtn>

            <CardLinkRow>
              <CardLink type="button" onClick={() => { setCurrentView('login'); setFindError(''); }}>
                로그인 화면으로 돌아가기
              </CardLink>
            </CardLinkRow>
          </FormCard>
        )}

        {/* ─── 4) 비밀번호 재설정 뷰 ─── */}
        {currentView === 'find-password-reset' && (
          <FormCard>
            <CardTitle>비밀번호 재설정</CardTitle>
            <div style={{ fontSize: '13px', color: '#666', textAlign: 'center', marginBottom: '20px' }}>
              <strong>{targetUserEmail}</strong> 계정의<br />새로운 비밀번호를 입력해주세요.
            </div>

            {isResetSuccess ? (
              <SuccessWrap>
                <SuccessCircle>✓</SuccessCircle>
                <SuccessTitle>재설정 완료!</SuccessTitle>
                <SuccessDesc>새로운 비밀번호가 안전하게 반영되었습니다.<br />잠시 후 로그인 화면으로 이동합니다.</SuccessDesc>
              </SuccessWrap>
            ) : (
              <>
                <FieldGroup>
                  <Label htmlFor="reset-password">새 비밀번호</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    placeholder="최소 6자 이상"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleResetPassword)}
                  />
                </FieldGroup>

                <FieldGroup>
                  <Label htmlFor="reset-password-confirm">새 비밀번호 확인</Label>
                  <Input
                    id="reset-password-confirm"
                    type="password"
                    placeholder="비밀번호 재입력"
                    value={resetPasswordConfirm}
                    onChange={(e) => setResetPasswordConfirm(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleResetPassword)}
                  />
                </FieldGroup>

                {resetError && <ErrorMsg role="alert">{resetError}</ErrorMsg>}

                <LoginBtn
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? <Spinner /> : '비밀번호 변경'}
                </LoginBtn>
              </>
            )}
          </FormCard>
        )}

        {/* 하단 푸터 */}
        <FooterSection>
          <FooterLogoImg src="/assets/logo_01.png" alt="MoodPlace" />
          <FooterTagline>
            <TagLine />
            <TagText>당신이 분위기에 맞는 공간을 찾다</TagText>
            <TagLine />
          </FooterTagline>
          <FooterLinks>
            <FooterLink type="button" onClick={() => { setCurrentView('signup'); setError(''); setFindError(''); }}>
              회원가입
            </FooterLink>
            <FooterLink type="button" onClick={() => { setCurrentView('find-password'); setError(''); setSignUpError(''); }}>
              비밀번호 찾기
            </FooterLink>
          </FooterLinks>
        </FooterSection>
      </PageContainer>

      {/* ─── 5) 소셜 로그인 인터랙티브 모사 모달 ─── */}
      {socialModalType && (
        <SocialModalOverlay onClick={() => !socialLoading && setSocialModalType(null)}>
          <SocialModalCard onClick={(e) => e.stopPropagation()}>
            {socialLoading ? (
              <SocialLoadingScreen>
                <Spinner style={{ borderColor: '#e5e2de', borderTopColor: '#2D5244', width: '28px', height: '28px' }} />
                <LoadingText>{socialModalType.toUpperCase()} 계정 정보 연동 중...</LoadingText>
              </SocialLoadingScreen>
            ) : (
              <>
                {/* 1. 구글 모달 */}
                {socialModalType === 'google' && (
                  <GoogleLayout>
                    <GoogleHeader>
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <GoogleTitle>Google 계정으로 로그인</GoogleTitle>
                      <GoogleSub>my MoodPlace 앱으로 이동할 계정을 선택하세요.</GoogleSub>
                    </GoogleHeader>
                    
                    <GoogleAccountList>
                      <GoogleAccountItem onClick={() => handleSocialSelect('Google', 'jisoo.kim@gmail.com', '김지수')}>
                        <GoogleAvatar $color="#4285f4">지</GoogleAvatar>
                        <div>
                          <AccountName>김지수</AccountName>
                          <AccountEmail>jisoo.kim@gmail.com</AccountEmail>
                        </div>
                      </GoogleAccountItem>

                      <GoogleAccountItem onClick={() => handleSocialSelect('Google', 'minu.lee@gmail.com', '이민우')}>
                        <GoogleAvatar $color="#34a853">민</GoogleAvatar>
                        <div>
                          <AccountName>이민우</AccountName>
                          <AccountEmail>minu.lee@gmail.com</AccountEmail>
                        </div>
                      </GoogleAccountItem>

                      <GoogleAccountItem onClick={() => handleSocialSelect('Google', 'guest.google@gmail.com', '구글 게스트')}>
                        <GoogleAvatar $color="#757575">G</GoogleAvatar>
                        <div>
                          <AccountName>다른 계정 사용</AccountName>
                          <AccountEmail>guest.google@gmail.com</AccountEmail>
                        </div>
                      </GoogleAccountItem>
                    </GoogleAccountList>
                    
                    <GoogleFooter>
                      안전한 이용을 돕기 위해 Google에서 사용자의 이름, 이메일 주소, 언어 설정, 프로필 사진을 my MoodPlace와 공유합니다.
                    </GoogleFooter>
                  </GoogleLayout>
                )}

                {/* 2. 카카오 모달 */}
                {socialModalType === 'kakao' && (
                  <KakaoLayout>
                    <KakaoHeader>
                      <KakaoIconWrap>
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="#3C1E1E">
                          <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.79 1.643 5.24 4.126 6.727L5.1 21l4.5-2.3c.78.15 1.576.23 2.4.23 5.523 0 10-3.477 10-7.8C22 6.477 17.523 3 12 3z" />
                        </svg>
                      </KakaoIconWrap>
                      <KakaoTitle>kakao</KakaoTitle>
                    </KakaoHeader>
                    
                    <KakaoBody>
                      <KakaoAppRow>
                        <KakaoLogoMini>
                          <svg viewBox="0 0 100 124" width="22" height="26">
                            <path d="M50 4C29 4 12 21 12 42c0 28 38 74 38 74s38-46 38-74C88 21 71 4 50 4z" fill="#2D5244" />
                            <circle cx="50" cy="42" r="27" fill="#FFFFFF" />
                          </svg>
                        </KakaoLogoMini>
                        <div>
                          <KakaoAppName>my MoodPlace</KakaoAppName>
                          <KakaoAppDeveloper>Google DeepMind Team</KakaoAppDeveloper>
                        </div>
                      </KakaoAppRow>

                      <KakaoNotice>
                        서비스 이용을 위해 아래 권한 제공 동의가 필요합니다.
                      </KakaoNotice>

                      <KakaoConsentList>
                        <ConsentItem>
                          <ConsentCheck>✓</ConsentCheck>
                          <span>[필수] 개인정보 수집 및 이용 동의</span>
                        </ConsentItem>
                        <ConsentItem>
                          <ConsentCheck>✓</ConsentCheck>
                          <span>[필수] 프로필 정보 (닉네임/사진) 제공</span>
                        </ConsentItem>
                        <ConsentItem>
                          <ConsentCheck>✓</ConsentCheck>
                          <span>[선택] 이메일 주소 (kakao_user@kakao.com) 제공</span>
                        </ConsentItem>
                      </KakaoConsentList>
                    </KakaoBody>

                    <KakaoActionRow>
                      <KakaoCancelBtn onClick={() => setSocialModalType(null)}>취소</KakaoCancelBtn>
                      <KakaoSubmitBtn onClick={() => handleSocialSelect('Kakao', 'kakao_user@kakao.com', '카카오 사용자')}>
                        동의하고 시작하기
                      </KakaoSubmitBtn>
                    </KakaoActionRow>
                  </KakaoLayout>
                )}

                {/* 3. 애플 모달 */}
                {socialModalType === 'apple' && (
                  <AppleLayout>
                    <AppleHeader>
                      <svg viewBox="0 0 18 18" width="28" height="28" fill="#FFFFFF">
                        <path d="M15.56 9.3c0-2.22 1.8-3.27 1.9-3.36-1.04-1.5-2.63-1.7-3.2-1.73-1.37-.14-2.68.8-3.38.8-.7 0-1.78-.77-2.92-.75-1.5.02-2.88.88-3.66 2.23-1.56 2.7-.4 6.7 1.12 8.9 1.56 1.07 1.83 1.15 2.1 1.13.27-.02.38-.1.7-.1s.44.1.72.08c.28-.02.53-.1 2.08-1.12 1.55-1.02 1.76-1.1 1.9-1.28.14-.18 2.08-2.43 2.08-4.96zM13.68 3.3c.6-.72 1-1.72.88-2.72-.85.03-1.9.56-2.5 1.27-.54.63-.98 1.64-.86 2.62.96.08 1.9-.45 2.48-1.17z"/>
                      </svg>
                      <AppleTitle>Apple ID로 로그인</AppleTitle>
                      <AppleDesc>Apple ID <strong>apple_user@apple.com</strong> 계정으로 my MoodPlace에 가입하거나 로그인합니다.</AppleDesc>
                    </AppleHeader>

                    <AppleAuthSection>
                      <AppleFaceIDRing>
                        <FaceIDLines />
                      </AppleFaceIDRing>
                      <FaceIDText>Apple Face ID 인증 진행 중...</FaceIDText>
                    </AppleAuthSection>

                    <AppleActionRow>
                      <AppleSubmitBtn onClick={() => handleSocialSelect('Apple', 'apple_user@apple.com', 'Apple 사용자')}>
                        Apple ID로 계속하기
                      </AppleSubmitBtn>
                      <AppleCancelBtn onClick={() => setSocialModalType(null)}>취소</AppleCancelBtn>
                    </AppleActionRow>
                  </AppleLayout>
                )}
              </>
            )}
          </SocialModalCard>
        </SocialModalOverlay>
      )}
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

const pulseRing = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 102, 204, 0.4); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0, 102, 204, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 102, 204, 0); }
`;

/* ─── Styled Components ─── */
const PageBg = styled.div`
  min-height: 100vh;
  background: #f2ede8;
  display: flex;
  justify-content: center;
  align-items: stretch;
`;

const PageContainer = styled.main`
  width: 100%;
  max-width: 390px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 16px 32px;
  animation: ${fadeUp} 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

/* ─── Brand ─── */
const BrandSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 36px;
`;

const BrandLogoImg = styled.img`
  height: 60px;
  object-fit: contain;
  margin-bottom: 14px;
`;

const Tagline = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TagLine = styled.span`
  display: inline-block;
  width: 28px;
  height: 1px;
  background: #999;
`;

const TagText = styled.span`
  font-size: 12px;
  color: #777;
  letter-spacing: 0.5px;
  white-space: nowrap;
`;

/* ─── Form Card ─── */
const FormCard = styled.section`
  width: 100%;
  background: #ffffff;
  border-radius: 20px;
  padding: 28px 22px 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.09);
  margin-bottom: 32px;
`;

const CardTitle = styled.h2`
  font-size: 20px;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 24px;
  text-align: center;
  letter-spacing: -0.5px;
`;

const FieldGroup = styled.div`
  margin-bottom: 14px;
`;

const Label = styled.label`
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #555;
  letter-spacing: 1px;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  height: 50px;
  border: 1px solid #d8d5d0;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 14px;
  color: #1a1a1a;
  background: #fff;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  font-family: inherit;

  &::placeholder {
    color: #aaa;
  }

  &:focus {
    border-color: #2D5244;
  }
`;

const ErrorMsg = styled.p`
  font-size: 12.5px;
  color: #e2574c;
  margin-bottom: 12px;
  text-align: center;
  font-weight: 600;
`;

const LoginBtn = styled.button`
  width: 100%;
  height: 52px;
  background: #2D5244;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-top: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, opacity 0.2s;

  &:hover { background: #1e3b30; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 16px;
`;

const DivLine = styled.span`
  flex: 1;
  height: 1px;
  background: #e5e2de;
`;

const DivText = styled.span`
  font-size: 12px;
  color: #999;
  white-space: nowrap;
`;

const SocialRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
`;

const SocialBtn = styled.button<{ $bgColor?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: ${({ $bgColor }) => $bgColor || '#f0ede9'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);

  svg { width: 26px; height: 26px; }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  }
`;

const CardLinkRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 18px;
`;

const CardLink = styled.button`
  font-size: 13.5px;
  color: #666;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  transition: color 0.15s;

  &:hover { color: #2D5244; }
`;

/* ─── Success screen ─── */
const SuccessWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
`;

const SuccessCircle = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #eaf6f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2D5244;
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 18px;
  box-shadow: 0 4px 12px rgba(45, 82, 68, 0.15);
`;

const SuccessTitle = styled.h3`
  font-size: 18px;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 8px;
  text-align: center;
`;

const SuccessDesc = styled.p`
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  text-align: center;
`;

/* ─── Footer ─── */
const FooterSection = styled.footer`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: auto;
`;

const FooterLogoImg = styled.img`
  height: 38px;
  object-fit: contain;
`;

const FooterTagline = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 48px;
`;

const FooterLink = styled.button`
  font-size: 12.5px;
  color: #666;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;

  &:hover { color: #2D5244; }
`;

/* ─── Social Login Modals ─── */
const SocialModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(5px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.22s ease-out;
  padding: 20px;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const SocialModalCard = styled.div`
  width: 100%;
  max-width: 350px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: scaleUp 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);

  @keyframes scaleUp {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
`;

const SocialLoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
`;

const LoadingText = styled.p`
  margin-top: 16px;
  font-size: 14.5px;
  font-weight: 700;
  color: #2D5244;
`;

/* Google Layout */
const GoogleLayout = styled.div`
  padding: 24px;
  font-family: Roboto, -apple-system, sans-serif;
`;

const GoogleHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 20px;
`;

const GoogleTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #202124;
  margin-top: 12px;
  margin-bottom: 4px;
`;

const GoogleSub = styled.p`
  font-size: 13.5px;
  color: #5f6368;
  line-height: 1.4;
`;

const GoogleAccountList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #dadce0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const GoogleAccountItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: none;
  border: none;
  border-bottom: 1px solid #dadce0;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;

  &:hover { background: #f8f9fa; }
  &:last-child { border-bottom: none; }
`;

const GoogleAvatar = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AccountName = styled.p`
  font-size: 13.5px;
  font-weight: 600;
  color: #3c4043;
`;

const AccountEmail = styled.p`
  font-size: 12px;
  color: #70757a;
`;

const GoogleFooter = styled.p`
  font-size: 11px;
  color: #70757a;
  line-height: 1.5;
  text-align: justify;
`;

/* Kakao Layout */
const KakaoLayout = styled.div`
  background: #fff;
`;

const KakaoHeader = styled.div`
  background: #FEE500;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const KakaoIconWrap = styled.div`
  background: #3C1E1E;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const KakaoTitle = styled.h3`
  font-size: 18px;
  font-weight: 800;
  color: #3C1E1E;
  letter-spacing: -0.5px;
`;

const KakaoBody = styled.div`
  padding: 24px 20px 16px;
`;

const KakaoAppRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f1f1;
  margin-bottom: 16px;
`;

const KakaoLogoMini = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #2D5244;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const KakaoAppName = styled.p`
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
`;

const KakaoAppDeveloper = styled.p`
  font-size: 11.5px;
  color: #777;
`;

const KakaoNotice = styled.p`
  font-size: 13.5px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
`;

const KakaoConsentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fafafa;
  border-radius: 8px;
  padding: 12px 14px;
`;

const ConsentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: #444;
`;

const ConsentCheck = styled.span`
  color: #2D5244;
  font-weight: 700;
`;

const KakaoActionRow = styled.div`
  display: flex;
  border-top: 1px solid #f1f1f1;
`;

const KakaoCancelBtn = styled.button`
  flex: 1;
  height: 52px;
  background: #f7f7f7;
  color: #666;
  border: none;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #eee; }
`;

const KakaoSubmitBtn = styled.button`
  flex: 2;
  height: 52px;
  background: #FEE500;
  color: #3C1E1E;
  border: none;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  &:hover { background: #edd300; }
`;

/* Apple Layout */
const AppleLayout = styled.div`
  background: #111111;
  color: #ffffff;
  padding: 28px 24px;
`;

const AppleHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
`;

const AppleTitle = styled.h3`
  font-size: 19px;
  font-weight: 700;
  margin-top: 14px;
  margin-bottom: 6px;
  letter-spacing: -0.5px;
`;

const AppleDesc = styled.p`
  font-size: 13px;
  color: #888;
  line-height: 1.5;
`;

const AppleAuthSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28px;
`;

const AppleFaceIDRing = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid #0066cc;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${pulseRing} 1.6s ease-in-out infinite;
  margin-bottom: 12px;
`;

const FaceIDLines = styled.div`
  width: 28px;
  height: 28px;
  background-image: radial-gradient(circle, #0066cc 2px, transparent 2px);
  background-size: 8px 8px;
`;

const FaceIDText = styled.p`
  font-size: 12px;
  color: #0066cc;
  font-weight: 600;
`;

const AppleActionRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AppleSubmitBtn = styled.button`
  width: 100%;
  height: 48px;
  background: #ffffff;
  color: #000000;
  border: none;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  &:hover { background: #e5e5e5; }
`;

const AppleCancelBtn = styled.button`
  width: 100%;
  height: 44px;
  background: transparent;
  color: #888;
  border: none;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  &:hover { color: #fff; }
`;
