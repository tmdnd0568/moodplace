import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './styles/theme';
import { GlobalStyle } from './styles/GlobalStyle';
import { StoreProvider, useStore } from './store/StoreContext';
import { AppShell } from './components/AppShell';

// Pages
import { SplashPage } from './pages/SplashPage';
import { LoginPage } from './pages/LoginPage';
import { MainPage } from './pages/MainPage';
import { ReviewPage } from './pages/ReviewPage';
import { ReservationPage } from './pages/ReservationPage';
import { MapPage } from './pages/MapPage';
import { FindPage } from './pages/FindPage';
import { MyPage } from './pages/MyPage';
import { KeepPage } from './pages/KeepPage';
import { OnboardingPage } from './pages/OnboardingPage';

/** 로그인 상태 확인 및 온보딩 체크 – 로그인 필수, 온보딩 미완료 시 온보딩 페이지로 강제 리다이렉트 */
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem('moodplace_auth') === 'true';
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 온보딩 체크
  const userEmail = sessionStorage.getItem('moodplace_user_email') || '';
  const usersData = localStorage.getItem('moodplace_users');
  let hasOnboarded = sessionStorage.getItem('moodplace_onboarded') === 'true';

  if (!hasOnboarded && userEmail && usersData) {
    try {
      const users = JSON.parse(usersData);
      const user = users.find((u: any) => u.email.toLowerCase() === userEmail.toLowerCase());
      if (user && user.tags && user.tags.length > 0) {
        hasOnboarded = true;
        sessionStorage.setItem('moodplace_onboarded', 'true');
      }
    } catch (e) {
      console.error('RequireAuth 온보딩 검증 오류:', e);
    }
  }

  if (!hasOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

/** 온보딩 진입 제어 – 로그인 필수, 이미 온보딩을 완료한 경우 메인으로 강제 리다이렉트 */
const RequireOnboarding: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem('moodplace_auth') === 'true';
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userEmail = sessionStorage.getItem('moodplace_user_email') || '';
  const usersData = localStorage.getItem('moodplace_users');
  let hasOnboarded = sessionStorage.getItem('moodplace_onboarded') === 'true';

  if (!hasOnboarded && userEmail && usersData) {
    try {
      const users = JSON.parse(usersData);
      const user = users.find((u: any) => u.email.toLowerCase() === userEmail.toLowerCase());
      if (user && user.tags && user.tags.length > 0) {
        hasOnboarded = true;
        sessionStorage.setItem('moodplace_onboarded', 'true');
      }
    } catch (e) {
      console.error('RequireOnboarding 온보딩 검증 오류:', e);
    }
  }

  if (hasOnboarded) {
    return <Navigate to="/main" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { state } = useStore();
  const currentTheme = state.darkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle />
      <AppShell>
        <BrowserRouter>
          <Routes>
            {/* 공개 라우트 */}
            <Route path="/" element={<SplashPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* 보호된 라우트 – 로그인 및 온보딩 여부에 따른 강제 흐름 제어 */}
            <Route path="/onboarding" element={<RequireOnboarding><OnboardingPage /></RequireOnboarding>} />
            <Route path="/main" element={<RequireAuth><MainPage /></RequireAuth>} />
            <Route path="/review/:cafeId" element={<RequireAuth><ReviewPage /></RequireAuth>} />
            <Route path="/reservation" element={<Navigate to="/reservation/forest-lounge" replace />} />
            <Route path="/reservation/:cafeId" element={<RequireAuth><ReservationPage /></RequireAuth>} />
            <Route path="/map" element={<Navigate to="/map/forest-lounge" replace />} />
            <Route path="/map/:cafeId" element={<RequireAuth><MapPage /></RequireAuth>} />
            <Route path="/find" element={<RequireAuth><FindPage /></RequireAuth>} />
            <Route path="/my" element={<RequireAuth><MyPage /></RequireAuth>} />
            <Route path="/keep" element={<RequireAuth><KeepPage /></RequireAuth>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppShell>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
