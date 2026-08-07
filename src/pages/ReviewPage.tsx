import React, { useState } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { SubHeader } from '../components/SubHeader';
import { Icon } from '../components/icons/Icons';

// 카페 상세정보를 위한 주소 및 연락처 맵핑 헬퍼
const getAddress = (cafeId: string, defaultLocation: string) => {
  if (cafeId === 'forest-lounge') return '서울 성동구 아차산로9길 8';
  if (cafeId === 'urban-nest') return '서울 성동구 서울숲2길 28-11';
  if (cafeId === 'vivid-garden') return '서울 성동구 성수이로 78';
  if (cafeId === 'quiet-tea-room') return '서울 성동구 서울숲2길 18-11';
  if (cafeId === 'calm-forest') return '서울 성동구 성수이로74길 9';
  if (cafeId === 'brick-atelier') return '서울 성동구 연무장15길 11';
  return defaultLocation || '서울 성동구 성수동 일대';
};

const getPhone = (cafeId: string) => {
  if (cafeId === 'forest-lounge') return '0507-1386-3238';
  if (cafeId === 'urban-nest') return '0507-1428-2016';
  if (cafeId === 'vivid-garden') return '02-499-9669';
  if (cafeId === 'quiet-tea-room') return '0507-1318-4320';
  if (cafeId === 'calm-forest') return '0507-1317-2301';
  if (cafeId === 'brick-atelier') return '0507-1384-2451';
  return '02-1234-5678';
};

export const ReviewPage: React.FC = () => {
  const { cafeId } = useParams<{ cafeId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();

  // 정적 리스트 대신 Store Context State에서 동적으로 카페 조회를 수행
  const cafe = state.cafes.find((c) => c.id === cafeId);

  const [isLiked, setIsLiked] = useState(false);
  const [isAllReviewsOpen, setIsAllReviewsOpen] = useState(false);

  // 리뷰 작성 모달 상태
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [selectedMoodTags, setSelectedMoodTags] = useState<string[]>([]);
  const [mockPhotoName, setMockPhotoName] = useState('');
  const [writeError, setWriteError] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  if (!cafe) {
    return (
      <ErrorContainer>
        <p>카페 정보를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/main')}>메인으로 이동</button>
      </ErrorContainer>
    );
  }

  const handleBack = () => {
    navigate(-1);
  };

  const handleToggleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleShare = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl)
      .then(() => {
        alert('링크가 클립보드에 복사되었습니다!');
      })
      .catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = currentUrl;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          alert('링크가 클립보드에 복사되었습니다!');
        } catch (e) {
          alert('링크 복사에 실패했습니다.');
        }
        document.body.removeChild(textArea);
      });
  };

  const handleBookmarkToggle = () => {
    dispatch({ type: 'TOGGLE_BOOKMARK', payload: cafe.id });
  };

  const handleGoToReservation = () => {
    dispatch({ type: 'GO_TO_SCREEN', payload: 'reservation' });
    navigate(`/reservation/${cafe.id}`);
  };

  // 길찾기 외부앱 연동 링크 생성
  const handleMapRedirect = (provider: 'naver' | 'kakao') => {
    const query = encodeURIComponent(cafe.name);
    const url = provider === 'naver'
      ? `https://map.naver.com/v5/search/${query}`
      : `https://map.kakao.com/?q=${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 개별 리뷰 좋아요 토글 처리
  const handleToggleReviewLike = (reviewId: string) => {
    dispatch({
      type: 'TOGGLE_REVIEW_LIKE',
      payload: { cafeId: cafe.id, reviewId }
    });
  };

  // 모달 안에서 태그 선택 토글
  const handleMoodTagToggle = (tag: string) => {
    if (selectedMoodTags.includes(tag)) {
      setSelectedMoodTags(selectedMoodTags.filter((t) => t !== tag));
    } else {
      setSelectedMoodTags([...selectedMoodTags, tag]);
    }
  };

  // 사진 업로드 버튼 모사 클릭
  const handlePhotoUploadMock = () => {
    const randomPhotos = ['cafe_interior_01.jpg', 'coffee_flatwhite.jpg', 'dessert_waffle.jpg'];
    const chosen = randomPhotos[Math.floor(Math.random() * randomPhotos.length)];
    setMockPhotoName(chosen);
  };

  // 리뷰 등록
  const handleSubmitReview = () => {
    if (!newReviewText.trim()) {
      setWriteError('리뷰 내용을 입력해 주세요.');
      return;
    }
    setWriteError('');

    const userNickname = sessionStorage.getItem('moodplace_user_name') || '방문자';
    const userInitial = userNickname.charAt(0).toUpperCase();

    const newReview = {
      id: `rev-${Date.now()}`,
      author: userNickname,
      initial: userInitial,
      rating: newRating,
      date: '방금 전',
      text: newReviewText.trim(),
      tags: selectedMoodTags.map(t => `#${t}`),
      likes: 0,
      likedByUser: false
    };

    dispatch({
      type: 'ADD_REVIEW',
      payload: { cafeId: cafe.id, review: newReview }
    });

    // 필드 초기화 및 모달 닫기
    setNewRating(5);
    setNewReviewText('');
    setSelectedMoodTags([]);
    setMockPhotoName('');
    setIsWriteModalOpen(false);
    setIsAlertOpen(true);
  };

  const isBookmarked = state.bookmarkedIds.includes(cafe.id);

  const displayedReviews = isAllReviewsOpen
    ? cafe.detail.reviews
    : cafe.detail.reviews.slice(0, 2);

  return (
    <PageContainer>
      <SubHeader
        onBack={handleBack}
        title={cafe.name}
        rightActions={[
          {
            icon: isLiked ? 'heartFilled' : 'heart',
            onClick: handleToggleLike,
            label: '좋아요',
            active: isLiked,
            activeColor: '#e2574c',
          },
          {
            icon: 'share',
            onClick: handleShare,
            label: '공유',
          },
        ]}
      />

      <ContentScroll>
        <PhotoSlider>
          {cafe.photo.type === 'image' && cafe.photo.image ? (
            <PhotoSlideImg src={cafe.photo.image} alt={cafe.name} />
          ) : (
            <PhotoGradient $from={cafe.photo.from} $to={cafe.photo.to}>
              <EmojiWrapper>{cafe.photo.emoji}</EmojiWrapper>
            </PhotoGradient>
          )}
        </PhotoSlider>

        <IntroCard>
          <IntroTop>
            <MetaTagRow>
              {cafe.detail.detailTags.map((tag) => (
                <MetaTag key={tag}>#{tag}</MetaTag>
              ))}
            </MetaTagRow>
            
            <ReservationBtn onClick={handleGoToReservation} aria-label="상세정보 화면 이동">
              정보
            </ReservationBtn>
          </IntroTop>
          
          <CafeTitleRow>
            <CafeName>{cafe.name}</CafeName>
            <RatingBadge>
              <Icon name="star" className="star-icon" />
              <span>{cafe.detail.rating}</span>
            </RatingBadge>
          </CafeTitleRow>

          <CafeDescription>{cafe.detail.description}</CafeDescription>

          <HoursRow>
            <Icon name="clock" className="clock-icon" />
            <span>영업 중 • {cafe.detail.hoursLabel}</span>
          </HoursRow>

          <InfoRow>
            <Icon name="pin" className="info-icon" />
            <span>{getAddress(cafe.id, cafe.location)}</span>
          </InfoRow>

          <InfoRow>
            <Icon name="phone" className="info-icon" />
            <span>{getPhone(cafe.id)}</span>
          </InfoRow>

          <MapLinksRow>
            <MapLinkBtn onClick={() => handleMapRedirect('naver')} className="naver-map">
              네이버 지도 길찾기
            </MapLinkBtn>
            <MapLinkBtn onClick={() => handleMapRedirect('kakao')} className="kakao-map">
              카카오맵 길찾기
            </MapLinkBtn>
          </MapLinksRow>
        </IntroCard>

        {cafe.detail.menu && cafe.detail.menu.length > 0 && (
          <Section>
            <SectionTitle>대표 메뉴</SectionTitle>
            <MenuList>
              {cafe.detail.menu.map((menuItem) => (
                <MenuItemCard key={menuItem.id}>
                  <MenuThumb src={menuItem.image} alt={menuItem.name} />
                  <MenuInfo>
                    <MenuNameRow>
                      <MenuName>{menuItem.name}</MenuName>
                      <MenuPrice>{menuItem.price}</MenuPrice>
                    </MenuNameRow>
                    <MenuDesc>{menuItem.desc}</MenuDesc>
                  </MenuInfo>
                </MenuItemCard>
              ))}
            </MenuList>
          </Section>
        )}

        <Section>
          <ReviewHeaderRow>
            <SectionTitle style={{ marginBottom: 0 }}>방문자 리뷰 ({cafe.detail.reviewCount})</SectionTitle>
            <WriteReviewBtn type="button" onClick={() => setIsWriteModalOpen(true)}>
              <Icon name="edit" className="edit-icon" />
              <span>리뷰 쓰기</span>
            </WriteReviewBtn>
          </ReviewHeaderRow>

          <ReviewList>
            {displayedReviews.length > 0 ? (
              displayedReviews.map((review) => (
                <ReviewItem key={review.id}>
                  <ReviewAuthorRow>
                    <AuthorAvatar>{review.initial}</AuthorAvatar>
                    <AuthorMeta>
                      <AuthorName>{review.author}</AuthorName>
                      <ReviewRatingRow>
                        {[...Array(5)].map((_, i) => (
                          <Icon
                            key={i}
                            name="star"
                            className={`star-icon ${i < review.rating ? 'active' : ''}`}
                          />
                        ))}
                        <ReviewDate>{review.date}</ReviewDate>
                      </ReviewRatingRow>
                    </AuthorMeta>
                  </ReviewAuthorRow>
                  <ReviewText>{review.text}</ReviewText>
                  
                  {review.tags.length > 0 && (
                    <ReviewTags>
                      {review.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </ReviewTags>
                  )}

                  <ReviewActionBar>
                    <ReviewLikeBtn 
                      type="button" 
                      onClick={() => handleToggleReviewLike(review.id)}
                      className={review.likedByUser ? 'is-liked' : ''}
                    >
                      <Icon name="heartFilled" className="like-icon" />
                      <span>도움이 되었어요 {review.likes || 0}</span>
                    </ReviewLikeBtn>
                  </ReviewActionBar>
                </ReviewItem>
              ))
            ) : (
              <NoReviews>첫 번째 리뷰를 작성해보세요!</NoReviews>
            )}
          </ReviewList>
          
          {cafe.detail.reviews.length > 2 && (
            <MoreReviewsBtn type="button" onClick={() => setIsAllReviewsOpen(!isAllReviewsOpen)}>
              {isAllReviewsOpen ? '리뷰 접기' : '전체 리뷰 보기'}
            </MoreReviewsBtn>
          )}
        </Section>
      </ContentScroll>

      <FixedFooter>
        <BookmarkFootBtn
          type="button"
          onClick={handleBookmarkToggle}
          className={isBookmarked ? 'is-bookmarked' : ''}
          aria-label="북마크"
        >
          <Icon name={isBookmarked ? 'bookmarkFilled' : 'bookmark'} />
        </BookmarkFootBtn>
        <PrimaryFootBtn onClick={handleGoToReservation}>
          네이버 예약 바로가기
        </PrimaryFootBtn>
      </FixedFooter>

      {/* ─── 리뷰 작성 모달 (바텀시트 스타일) ─── */}
      {isWriteModalOpen && (
        <ModalOverlay onClick={() => setIsWriteModalOpen(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>리뷰 작성하기</ModalTitle>
              <CloseBtn onClick={() => setIsWriteModalOpen(false)} aria-label="닫기">
                <Icon name="close" />
              </CloseBtn>
            </ModalHeader>

            <ModalScrollContent>
              {/* 별점 선택 */}
              <ModalSection>
                <ModalLabel>평가 별점</ModalLabel>
                <StarsRow>
                  {[1, 2, 3, 4, 5].map((starNum) => (
                    <Icon
                      key={starNum}
                      name="star"
                      className={`star-select ${starNum <= newRating ? 'active' : ''}`}
                      onClick={() => setNewRating(starNum)}
                    />
                  ))}
                </StarsRow>
              </ModalSection>

              {/* 분위기 태그 선택 */}
              <ModalSection>
                <ModalLabel>분위기 키워드 (다중 선택)</ModalLabel>
                <TagsGrid>
                  {['조용한', '아늑한', '채광좋은', '음악맛집', '작업하기좋은', '디저트맛집', '감성카페', '친절한'].map((tag) => {
                    const active = selectedMoodTags.includes(tag);
                    return (
                      <ModalTagChip
                        key={tag}
                        type="button"
                        className={active ? 'is-active' : ''}
                        onClick={() => handleMoodTagToggle(tag)}
                      >
                        #{tag}
                      </ModalTagChip>
                    );
                  })}
                </TagsGrid>
              </ModalSection>

              {/* 한줄/상세 리뷰 작성 */}
              <ModalSection>
                <ModalLabel>상세한 후기</ModalLabel>
                <Textarea
                  placeholder="카페의 분위기, 커피 맛, 작업 편의성 등 솔직한 리뷰를 공유해 주세요."
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                />
              </ModalSection>

              {/* 사진 업로드 */}
              <ModalSection>
                <ModalLabel>사진 첨부</ModalLabel>
                {mockPhotoName ? (
                  <SelectedPhotoRow>
                    <span style={{ fontSize: '13px' }}>📸 {mockPhotoName}</span>
                    <button type="button" onClick={() => setMockPhotoName('')} style={{ background: 'none', border: 'none', color: '#ff4d6d', cursor: 'pointer', fontWeight: 700 }}>삭제</button>
                  </SelectedPhotoRow>
                ) : (
                  <FileUploadMockZone onClick={handlePhotoUploadMock}>
                    <Icon name="share" style={{ width: '20px', height: '20px', color: '#888', transform: 'rotate(-90deg)' }} />
                    <UploadText>사진 업로드 시뮬레이션</UploadText>
                  </FileUploadMockZone>
                )}
              </ModalSection>

              {writeError && <ErrorMsg>{writeError}</ErrorMsg>}

              <WriteSubmitBtn onClick={handleSubmitReview}>
                리뷰 등록 완료
              </WriteSubmitBtn>
            </ModalScrollContent>
          </ModalCard>
        </ModalOverlay>
      )}
      {/* ─── 리뷰 등록 완료 알림 모달 ─── */}
      {isAlertOpen && (
        <AlertOverlay onClick={() => setIsAlertOpen(false)}>
          <AlertCard onClick={(e) => e.stopPropagation()}>
            <AlertBadge>
              <Icon name="check" className="check-icon" />
            </AlertBadge>
            <AlertTitle>리뷰 등록 완료</AlertTitle>
            <AlertMessage>
              작성해주신 소중한 리뷰가<br />성공적으로 등록되었습니다.
            </AlertMessage>
            <AlertConfirmBtn onClick={() => setIsAlertOpen(false)}>
              확인
            </AlertConfirmBtn>
          </AlertCard>
        </AlertOverlay>
      )}
    </PageContainer>
  );
};

/* ─── Styled Components ─── */
const PageContainer = styled.section`
  background: ${({ theme }) => theme.colors.bg};
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: ${({ theme }) => theme.space[4]};
`;

const ContentScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;
`;

const PhotoSlider = styled.div`
  height: 240px;
  background: #000;
  position: relative;
`;

const PhotoSlideImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PhotoGradient = styled.div<{ $from: string; $to: string }>`
  width: 100%;
  height: 100%;
  background: linear-gradient(160deg, ${({ $from }) => $from}, ${({ $to }) => $to});
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EmojiWrapper = styled.div`
  font-size: 64px;
`;

const IntroCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-bottom-left-radius: ${({ theme }) => theme.radius.lg};
  border-bottom-right-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[5]};
  margin-bottom: ${({ theme }) => theme.space[3]};
  box-shadow: ${({ theme }) => theme.shadow.card};
`;

const IntroTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

const MetaTagRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
`;

const MetaTag = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.primary};
`;

const ReservationBtn = styled.button`
  height: 28px;
  padding: 0 12px;
  border-radius: 14px;
  background: transparent;
  color: #000000;
  border: 1px solid #000000;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: linear-gradient(135deg, #2D5244 0%, #3E6D5A 100%);
    color: #ffffff;
    border-color: #2D5244;
    box-shadow: 0 2px 8px rgba(45, 82, 68, 0.2);
  }
`;

const CafeTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space[3]};
`;

const CafeName = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const RatingBadge = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  background: #fdf6e2;
  color: #d97706;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: 13px;
  font-weight: 700;

  .star-icon {
    width: 13px;
    height: 13px;
  }
`;

const CafeDescription = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

const HoursRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 8px;

  .clock-icon {
    width: 15px;
    height: 15px;
  }
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 8px;

  .info-icon {
    width: 15px;
    height: 15px;
  }
`;

const MapLinksRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 14px;
`;

const MapLinkBtn = styled.button`
  flex: 1;
  height: 38px;
  border-radius: 8px;
  border: 1px solid #e8e5e0;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  transition: all 0.2s ease;

  &.naver-map {
    color: #03c75a;
    border-color: #03c75a;
    &:hover { background: #f0fbf4; }
  }

  &.kakao-map {
    color: #3c1e1e;
    border-color: #fee500;
    background: #fee500;
    &:hover { background: #edd300; }
  }
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[5]};
  margin-bottom: ${({ theme }) => theme.space[3]};
  box-shadow: ${({ theme }) => theme.shadow.card};
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const MenuList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
  margin-top: 16px;
`;

const MenuItemCard = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[4]};
`;

const MenuThumb = styled.img`
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.radius.sm};
  object-fit: cover;
  flex-shrink: 0;
`;

const MenuInfo = styled.div`
  flex: 1;
`;

const MenuNameRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const MenuName = styled.p`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const MenuPrice = styled.p`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`;

const MenuDesc = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.4;
`;

const ReviewHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

const WriteReviewBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  .edit-icon {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: #eaf6f0;
  }
`;

const ReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

const ReviewItem = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding-bottom: ${({ theme }) => theme.space[4]};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const ReviewAuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

const AuthorAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primaryDark};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
`;

const AuthorMeta = styled.div`
  flex: 1;
`;

const AuthorName = styled.p`
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const ReviewRatingRow = styled.div`
  display: flex;
  align-items: center;
  
  .star-icon {
    width: 12px;
    height: 12px;
    color: #e2e1dd;
    
    &.active {
      color: #f59e0b;
    }
  }
`;

const ReviewDate = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-left: ${({ theme }) => theme.space[2]};
`;

const ReviewText = styled.p`
  font-size: 13px;
  color: #4a4a4a;
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

const ReviewTags = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[1]};
  flex-wrap: wrap;
  margin-bottom: 10px;

  span {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.bg};
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
  }
`;

const ReviewActionBar = styled.div`
  display: flex;
  justify-content: flex-start;
`;

const ReviewLikeBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fbfbf9;
  border: 1px solid #e8e5e0;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11.5px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;

  .like-icon {
    width: 11px;
    height: 11px;
    color: #bbb;
  }

  &.is-liked {
    background: #fef2f2;
    border-color: #fca5a5;
    color: #e2574c;
    font-weight: 700;

    .like-icon {
      color: #e2574c;
    }
  }

  &:hover {
    border-color: #cbd5e1;
  }
`;

const NoReviews = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  padding: ${({ theme }) => theme.space[4]} 0;
`;

const MoreReviewsBtn = styled.button`
  width: 100%;
  height: 44px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-top: ${({ theme }) => theme.space[4]};
  transition: background-color 0.2s;
  background: none;
  cursor: pointer;

  &:hover {
    background-color: #fbfbf9;
  }
`;

const FixedFooter = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.space[4]};
  gap: ${({ theme }) => theme.space[3]};
  z-index: 10;
`;

const BookmarkFootBtn = styled.button`
  width: 48px;
  height: 48px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  cursor: pointer;

  svg {
    width: 22px;
    height: 22px;
  }

  &.is-bookmarked {
    color: #e2574c;
    border-color: #fca5a5;
    background: #fef2f2;
  }
`;

const PrimaryFootBtn = styled.button`
  flex: 1;
  height: 48px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(45, 82, 68, 0.15);
  border: none;
  cursor: pointer;

  &:hover {
    background: #1e3b30;
  }
`;

/* ─── 리뷰 모달 관련 ─── */
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(5px);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

const ModalCard = styled.div`
  width: 100%;
  max-width: 390px;
  background: #ffffff;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 24px 20px;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 800;
  color: #1a1a1a;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  svg { width: 20px; height: 20px; }
`;

const ModalScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
`;

const ModalSection = styled.div`
  margin-bottom: 20px;
`;

const ModalLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
`;

const StarsRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  
  .star-select {
    width: 36px;
    height: 36px;
    color: #e5e2de;
    cursor: pointer;
    transition: color 0.15s, transform 0.1s;
    
    &.active {
      color: #f59e0b;
    }
    &:hover {
      transform: scale(1.1);
    }
  }
`;

const TagsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
`;

const ModalTagChip = styled.button`
  height: 34px;
  border-radius: 17px;
  border: 1px solid #e8e5e0;
  background: #fff;
  font-size: 11px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #fafafa;
  }

  &.is-active {
    background: #eaf6f0;
    border-color: #2D5244;
    color: #2D5244;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 100px;
  border: 1px solid #e8e5e0;
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  color: #1a1a1a;
  outline: none;
  resize: none;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    border-color: #2D5244;
  }
  &::placeholder {
    color: #bbb;
  }
`;

const SelectedPhotoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f1f4f0;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #2D5244;
  font-weight: 600;
`;

const FileUploadMockZone = styled.div`
  border: 2px dashed #dadce0;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  
  &:hover { background: #fbfbf9; }
`;

const UploadText = styled.p`
  font-size: 12.5px;
  color: #666;
  font-weight: 600;
`;

const WriteSubmitBtn = styled.button`
  width: 100%;
  height: 50px;
  background: #2D5244;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 10px;
  
  &:hover { background: #1e3b30; }
`;

const ErrorMsg = styled.p`
  font-size: 12px;
  color: #e2574c;
  margin-bottom: 10px;
  text-align: center;
  font-weight: 700;
`;

/* ─── 리뷰 등록 완료 알림 모달 스타일 ─── */
const AlertOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 600;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AlertCard = styled.div`
  background: #ffffff;
  border-radius: 20px;
  padding: 24px 20px;
  text-align: center;
  width: 82%;
  max-width: 300px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

  @keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

const AlertBadge = styled.div`
  width: 48px;
  height: 48px;
  background: #eaf6f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;

  .check-icon {
    width: 24px;
    height: 24px;
    color: #2D5244;
  }
`;

const AlertTitle = styled.h3`
  font-size: 17px;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 8px;
`;

const AlertMessage = styled.p`
  font-size: 13.5px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 20px;
`;

const AlertConfirmBtn = styled.button`
  width: 100%;
  height: 44px;
  background: #2D5244;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #1e3b30;
  }
`;
