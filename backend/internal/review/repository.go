package review

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Repository defines the interface for review persistence.
// Unique (userID, productID) is enforced at DB level via uniqueIndex on Review.
type Repository interface {
	Create(ctx context.Context, review *Review) error
	GetByProductID(ctx context.Context, productID int, page, limit int) ([]Review, int64, error)
	GetAverageRating(ctx context.Context, productID int) (float64, int64, error)
	GetUserReview(ctx context.Context, userID uuid.UUID, productID int) (*Review, error)
	Delete(ctx context.Context, reviewID uuid.UUID, userID uuid.UUID) error
}

// repository implements Repository using GORM.
type repository struct {
	db *gorm.DB
}

// NewRepository returns a new review Repository.
func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

// Create inserts a new review. Enforces unique (userID, productID) at DB level.
func (r *repository) Create(ctx context.Context, review *Review) error {
	return r.db.WithContext(ctx).Create(review).Error
}

// GetByProductID returns a paginated list of reviews for a product and the total count.
func (r *repository) GetByProductID(ctx context.Context, productID int, page, limit int) ([]Review, int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&Review{}).Where("product_id = ?", productID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var reviews []Review
	offset := (page - 1) * limit
	err := r.db.WithContext(ctx).Where("product_id = ?", productID).
		Order("created_at DESC").
		Offset(offset).Limit(limit).
		Find(&reviews).Error
	return reviews, total, err
}

// GetAverageRating returns the average rating and count of reviews for a product.
func (r *repository) GetAverageRating(ctx context.Context, productID int) (float64, int64, error) {
	var result struct {
		Avg   float64
		Count int64
	}
	err := r.db.WithContext(ctx).Model(&Review{}).Select("COALESCE(AVG(rating), 0) as avg, COUNT(*) as count").
		Where("product_id = ?", productID).Scan(&result).Error
	if err != nil {
		return 0, 0, err
	}
	return result.Avg, result.Count, nil
}

// GetUserReview returns the review for a user and product, or nil if not found.
func (r *repository) GetUserReview(ctx context.Context, userID uuid.UUID, productID int) (*Review, error) {
	var rev Review
	err := r.db.WithContext(ctx).Where("user_id = ? AND product_id = ?", userID, productID).First(&rev).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &rev, nil
}

// Delete removes a review by ID only if it belongs to the given user.
func (r *repository) Delete(ctx context.Context, reviewID uuid.UUID, userID uuid.UUID) error {
	res := r.db.WithContext(ctx).Where("id = ? AND user_id = ?", reviewID, userID).Delete(&Review{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
