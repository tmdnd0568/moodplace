import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      const exitTimer = setTimeout(() => {
        navigate('/login');
      }, 300);
      return () => clearTimeout(exitTimer);
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <SplashContainer className={isLeaving ? 'is-leaving' : ''}>
      <SplashContent>
        <SplashHeadline>무드에 맞는<br />장소를 찾아보세요</SplashHeadline>
        
        <SpacerTop aria-hidden="true" />
        
        <SplashCenter>
          <SplashBadge aria-hidden="true">
            <svg viewBox="0 0 100 124" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 4C29 4 12 21 12 42c0 28 38 74 38 74s38-46 38-74C88 21 71 4 50 4z" fill="#2D5244" />
              <circle cx="50" cy="42" r="27" fill="#FFFFFF" />
              <path d="M50 29c-2.4-3.4-8-3.4-9.6 0.6-1.4 3.4 1.4 6.4 9.6 11.4 8.2-5 11-8 9.6-11.4-1.6-4-7.2-4-9.6-0.6z" fill="#2D5244" />
              <path d="M35 46h24v8a8 8 0 0 1-8 8h-8a8 8 0 0 1-8-8v-8z" fill="none" stroke="#2D5244" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M59 48h3.5a4 4 0 0 1 0 8H59" fill="none" stroke="#2D5244" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </SplashBadge>
          
          <SplashLogo>
            <img src="/assets/logo_01.png" alt="MoodPlace" />
          </SplashLogo>
          
          <SplashTagline>
            <Line />
            <span>당신이 분위기에 맞는 공간을 찾다</span>
            <Line />
          </SplashTagline>
        </SplashCenter>

        <SpacerBottom aria-hidden="true" />
      </SplashContent>
    </SplashContainer>
  );
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const badgePulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const SplashContainer = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.bg};
  transition: opacity 0.30s ease, transform 0.30s cubic-bezier(0.4, 0, 0.2, 1);

  &.is-leaving {
    opacity: 0;
    transform: scale(0.97);
  }
`;

const SplashContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 ${({ theme }) => theme.space[6]};
  animation: ${fadeIn} 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const SplashHeadline = styled.h1`
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 28px;
  font-weight: 300;
  color: ${({ theme }) => theme.colors.primary};
  line-height: 1.35;
  margin-top: 70px;
  letter-spacing: -0.5px;
`;

const SpacerTop = styled.div`
  flex: 1.2;
`;

const SplashCenter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const SplashBadge = styled.div`
  width: 58px;
  height: 72px;
  margin-bottom: ${({ theme }) => theme.space[5]};
  animation: ${badgePulse} 3s ease-in-out infinite;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const SplashLogo = styled.div`
  width: 130px;
  margin-bottom: ${({ theme }) => theme.space[3]};
  
  img {
    width: 100%;
    height: auto;
  }
`;

const SplashTagline = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  letter-spacing: 2px;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
`;

const Line = styled.span`
  display: inline-block;
  width: 12px;
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
`;

const SpacerBottom = styled.div`
  flex: 1.8;
`;
