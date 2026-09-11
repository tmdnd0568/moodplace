import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../firebase';

// 사용자 프로필 데이터 모델 (비밀번호 제외)
interface UserProfile {
  email: string;
  name: string;
  avatar?: string;
  tags?: string[];
}

const getKoreanAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return '이메일 또는 비밀번호를 확인해주세요.';
    case 'auth/email-already-in-use':
      return '이미 가입된 이메일입니다.';
    case 'auth/weak-password':
      return '비밀번호는 6자 이상 입력해주세요.';
    case 'auth/invalid-email':
      return '이메일 형식을 확인해주세요.';
    case 'auth/popup-closed-by-user':
      return '로그인 창이 닫혔습니다.';
    case 'auth/operation-not-allowed':
    case 'auth/invalid-provider-id':
    case 'auth/configuration-not-found':
    case 'auth/unauthorized-domain':
      return '해당 로그인 방식은 현재 준비 중입니다.';
    case 'auth/too-many-requests':
      return '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.';
    default:
      return '인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.';
  }
};

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

  // 3) 비밀번호 찾기 폼 상태
  const [findEmail, setFindEmail] = useState('');
  const [findError, setFindError] = useState('');
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  // 게스트 로그인 처리
  const handleGuestLogin = () => {
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      sessionStorage.setItem('moodplace_auth', 'true');
      sessionStorage.setItem('moodplace_user_email', 'guest@moodplace.com');
      sessionStorage.setItem('moodplace_user_name', '게스트');
      sessionStorage.setItem('moodplace_onboarded', 'true');
      setIsLoading(false);
      navigate('/main');
    }, 600);
  };

  // 실제 Firebase 소셜 로그인 처리 (Google, Apple)
  const handleFirebaseSocialLogin = async (providerType: 'google' | 'apple') => {
    setError('');
    setIsLoading(true);
    try {
      const provider = providerType === 'google' ? googleProvider : appleProvider;
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userEmail = user.email || `${providerType}_user_${user.uid}@moodplace.com`;
      const userName = user.displayName || `${providerType.toUpperCase()} 사용자`;
      
      const users = getUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
      
      sessionStorage.setItem('moodplace_auth', 'true');
      sessionStorage.setItem('moodplace_user_email', userEmail);
      sessionStorage.setItem('moodplace_user_name', userName);
      
      const hasOnboarded = existingUser && existingUser.tags && existingUser.tags.length > 0;
      
      setIsLoading(false);
      if (hasOnboarded) {
        sessionStorage.setItem('moodplace_onboarded', 'true');
        navigate('/main');
      } else {
        if (!existingUser) {
          const newUser: UserProfile = {
            email: userEmail,
            name: userName
          };
          localStorage.setItem('moodplace_users', JSON.stringify([...users, newUser]));
        }
        navigate('/onboarding');
      }
    } catch (err: any) {
      console.error(`${providerType} Login Error:`, err);
      setIsLoading(false);
      
      if (providerType === 'apple' && (err.code === 'auth/operation-not-allowed' || err.code === 'auth/invalid-provider-id' || err.code === 'auth/configuration-not-found' || err.code === 'auth/unauthorized-domain')) {
        setError('Apple 로그인 기능은 현재 준비 중입니다.');
      } else {
        setError(getKoreanAuthErrorMessage(err?.code || ''));
      }
    }
  };

  // LocalStorage 사용자 프로필 DB (비밀번호 미포함)
  const getUsers = (): UserProfile[] => {
    const data = localStorage.getItem('moodplace_users');
    if (!data) return [];
    try {
      const list = JSON.parse(data);
      return list.map((u: any) => ({
        email: u.email,
        name: u.name,
        avatar: u.avatar,
        tags: u.tags
      }));
    } catch {
      return [];
    }
  };

  // 일반 이메일 로그인 핸들러 (Firebase Authentication)
  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      const userEmail = user.email || email.trim();
      const userName = user.displayName || email.trim().split('@')[0];

      sessionStorage.setItem('moodplace_auth', 'true');
      sessionStorage.setItem('moodplace_user_email', userEmail);
      sessionStorage.setItem('moodplace_user_name', userName);

      const users = getUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
      const hasOnboarded = existingUser && existingUser.tags && existingUser.tags.length > 0;

      setIsLoading(false);
      if (hasOnboarded) {
        sessionStorage.setItem('moodplace_onboarded', 'true');
        navigate('/main');
      } else {
        navigate('/onboarding');
      }
    } catch (err: any) {
      console.error('Email Login Error:', err);
      setIsLoading(false);
      setError(getKoreanAuthErrorMessage(err?.code || ''));
    }
  };

  // 이메일 회원가입 핸들러 (Firebase Authentication)
  const handleSignUp = async () => {
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

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signUpEmail.trim(), signUpPassword);
      const user = userCredential.user;

      if (signUpName.trim()) {
        await updateProfile(user, { displayName: signUpName.trim() });
      }

      const newProfile: UserProfile = {
        email: signUpEmail.trim(),
        name: signUpName.trim()
      };

      const users = getUsers();
      const updatedUsers = [...users.filter(u => u.email.toLowerCase() !== signUpEmail.trim().toLowerCase()), newProfile];
      localStorage.setItem('moodplace_users', JSON.stringify(updatedUsers));

      setIsLoading(false);
      setIsSignUpSuccess(true);

      setTimeout(() => {
        sessionStorage.setItem('moodplace_auth', 'true');
        sessionStorage.setItem('moodplace_user_email', newProfile.email);
        sessionStorage.setItem('moodplace_user_name', newProfile.name);
        setIsSignUpSuccess(false);
        navigate('/onboarding');
      }, 1500);
    } catch (err: any) {
      console.error('Email SignUp Error:', err);
      setIsLoading(false);
      setSignUpError(getKoreanAuthErrorMessage(err?.code || ''));
    }
  };

  // 비밀번호 찾기 (Firebase sendPasswordResetEmail)
  const handleFindPassword = async () => {
    setFindError('');
    if (!findEmail.trim()) {
      setFindError('이메일 주소를 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(findEmail.trim())) {
      setFindError('유효한 이메일 형식이 아닙니다.');
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, findEmail.trim());
      setIsLoading(false);
      setIsResetSuccess(true);
    } catch (err: any) {
      console.error('Password Reset Email Error:', err);
      setIsLoading(false);
      setFindError(getKoreanAuthErrorMessage(err?.code || ''));
    }
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
              <SocialBtn id="login-google" type="button" onClick={() => handleFirebaseSocialLogin('google')} disabled={isLoading} aria-label="구글로 로그인">
                <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.7 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-8 19.6-20 0-1.3-.1-2.7-.4-4H43.6z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.7 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5L31.5 34C29.7 35.3 27 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.2C9.4 38.7 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.3 5.4l6 5C40.9 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-4z" />
                </svg>
              </SocialBtn>

              <SocialBtn id="login-apple" type="button" $bgColor="#000" onClick={() => handleFirebaseSocialLogin('apple')} disabled={isLoading} aria-label="애플로 로그인">
                <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#fff" d="M34.5 25.8c0-4.9 4-7.2 4.2-7.4-2.3-3.3-5.8-3.8-7.1-3.8-3-.3-5.9 1.8-7.4 1.8-1.5 0-3.8-1.7-6.3-1.7-3.2 0-6.2 1.9-7.8 4.8-3.4 5.8-.9 14.4 2.4 19.1 1.6 2.3 3.5 4.9 6 4.8 2.4-.1 3.3-1.5 6.2-1.5s3.7 1.5 6.3 1.5 4.2-2.3 5.8-4.6 2.2-4.7 2.2-4.8c-.1 0-4.5-1.8-4.5-7.2zm-4.2-13.3c1.3-1.6 2.2-3.8 2-6-1.9.1-4.2 1.3-5.6 2.9-1.2 1.4-2.3 3.7-2 5.9 2.1.1 4.3-1.1 5.6-2.8z"/>
                </svg>
              </SocialBtn>

              <SocialBtn
                id="login-guest"
                type="button"
                $bgColor="#2D5244"
                onClick={handleGuestLogin}
                disabled={isLoading}
                aria-label="게스트로 로그인"
                title="게스트 로그인"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
                  <path
                    d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
                    fill="#FFFFFF"
                  />
                  <path
                    d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z"
                    fill="#FFFFFF"
                  />
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
            {isResetSuccess ? (
              <SuccessWrap>
                <SuccessCircle>✓</SuccessCircle>
                <SuccessTitle>이메일 발송 완료!</SuccessTitle>
                <SuccessDesc>
                  <strong>{findEmail}</strong> 주소로<br />비밀번호 재설정 이메일을 보냈습니다.<br />이메일을 확인해주세요.
                </SuccessDesc>
                <LoginBtn
                  type="button"
                  onClick={() => { setCurrentView('login'); setIsResetSuccess(false); setFindEmail(''); }}
                  style={{ marginTop: '16px' }}
                >
                  로그인 화면으로 돌아가기
                </LoginBtn>
              </SuccessWrap>
            ) : (
              <>
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
                  {isLoading ? <Spinner /> : '재설정 이메일 발송'}
                </LoginBtn>

                <CardLinkRow>
                  <CardLink type="button" onClick={() => { setCurrentView('login'); setFindError(''); }}>
                    로그인 화면으로 돌아가기
                  </CardLink>
                </CardLinkRow>
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
