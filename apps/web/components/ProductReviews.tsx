'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@shop/ui';
import { useAuth } from '../lib/auth/AuthContext';
import { useTranslation } from '../lib/i18n-client';
import type { Review } from './ProductReviews/utils';
import { useReviewForm } from './ProductReviews/hooks/useReviewForm';
import { ReviewSummary } from './ProductReviews/ReviewSummary';
import { ReviewForm } from './ProductReviews/ReviewForm';
import { ReviewList } from './ProductReviews/ReviewList';
import { ProductReviewsLoading } from './ProductReviews/ProductReviewsLoading';

interface ProductReviewsProps {
  productId?: string;
  productSlug?: string;
  reviews: Review[];
  setReviews: Dispatch<SetStateAction<Review[]>>;
  loading: boolean;
}

/**
 * PDP reviews block — fetch state is owned by the parent (`useReviews`) for a single request + header rating.
 */
export function ProductReviews({
  productId,
  productSlug,
  reviews,
  setReviews,
  loading,
}: ProductReviewsProps) {
  const { isLoggedIn, user } = useAuth();
  const { t } = useTranslation();

  const {
    showForm,
    setShowForm,
    rating,
    setRating,
    hoveredRating,
    setHoveredRating,
    comment,
    setComment,
    submitting,
    editingReviewId,
    handleEditReview,
    handleCancelEdit,
    handleSubmit,
    handleUpdateReview,
  } = useReviewForm({
    productId,
    productSlug,
    reviews,
    setReviews,
  });

  if (loading) {
    return <ProductReviewsLoading />;
  }

  const handleShowForm = () => {
    if (!isLoggedIn) {
      alert(t('common.reviews.loginRequired'));
      return;
    }
    setShowForm(true);
  };

  const handleLoginRequired = () => {
    alert(t('common.reviews.loginRequired'));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-200">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {t('common.reviews.title')}
        </h2>

        <ReviewSummary reviews={reviews} />

        {!showForm && (
          <Button
            variant="primary"
            onClick={handleShowForm}
            className="mb-8 rounded-xl font-semibold !border !border-[#e8cfa5] !bg-[#FFE5C2] !text-gray-900 shadow-sm transition-colors hover:!bg-[#f5dcb0] hover:!text-gray-900 focus-visible:!ring-2 focus-visible:!ring-[#2F3F3D] focus-visible:!ring-offset-2"
          >
            {t('common.reviews.writeReview')}
          </Button>
        )}

        {showForm && (
          <ReviewForm
            rating={rating}
            hoveredRating={hoveredRating}
            comment={comment}
            submitting={submitting}
            editingReviewId={editingReviewId}
            onRatingChange={setRating}
            onHover={setHoveredRating}
            onCommentChange={setComment}
            onSubmit={editingReviewId ? handleUpdateReview : handleSubmit}
            onCancel={
              editingReviewId
                ? handleCancelEdit
                : () => {
                    setShowForm(false);
                    setRating(0);
                    setComment('');
                  }
            }
          />
        )}
      </div>

      <ReviewList
        reviews={reviews}
        currentUserId={user?.id}
        showForm={showForm}
        onEditReview={handleEditReview}
        onShowForm={handleShowForm}
        onLoginRequired={handleLoginRequired}
      />
    </div>
  );
}
