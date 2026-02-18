package review

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Rakesh2908/shopgo/internal/product"
	"github.com/google/uuid"
)

const maxCommentLength = 500

// CreateReviewInput is the input for creating a review.
type CreateReviewInput struct {
	Rating  int
	Comment string
}

// ProductReviewsResult is the result of listing reviews for a product.
type ProductReviewsResult struct {
	Reviews    []Review `json:"reviews"`
	AvgRating  float64  `json:"avgRating"`
	TotalCount int64    `json:"totalCount"`
}

// Service defines the interface for review operations.
type Service interface {
	Create(ctx context.Context, userID uuid.UUID, productID int, input CreateReviewInput) (*Review, error)
	GetByProductID(ctx context.Context, productID int, page, limit int) (*ProductReviewsResult, error)
	Delete(ctx context.Context, reviewID uuid.UUID, userID uuid.UUID) error
}

// service implements Service.
type service struct {
	repo    Repository
	product product.ProductService
}

// NewService returns a new review Service.
func NewService(repo Repository, product product.ProductService) Service {
	return &service{repo: repo, product: product}
}

// Create creates a new review for a product. Enforces unique (userID, productID); one review per user per product.
func (s *service) Create(ctx context.Context, userID uuid.UUID, productID int, input CreateReviewInput) (*Review, error) {
	if input.Rating < 1 || input.Rating > 5 {
		return nil, errors.New("review: rating must be between 1 and 5")
	}
	if len(input.Comment) > maxCommentLength {
		return nil, fmt.Errorf("review: comment must be at most %d characters", maxCommentLength)
	}
	_, err := s.product.GetByID(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("review: product not found: %w", err)
	}
	rev := &Review{
		UserID:    userID,
		ProductID: productID,
		Rating:    input.Rating,
		Comment:   input.Comment,
		CreatedAt: time.Now(),
	}
	if err := s.repo.Create(ctx, rev); err != nil {
		return nil, err
	}
	return rev, nil
}

// GetByProductID returns paginated reviews for a product with average rating and total count.
func (s *service) GetByProductID(ctx context.Context, productID int, page, limit int) (*ProductReviewsResult, error) {
	reviews, total, err := s.repo.GetByProductID(ctx, productID, page, limit)
	if err != nil {
		return nil, err
	}
	avg, _, err := s.repo.GetAverageRating(ctx, productID)
	if err != nil {
		return nil, err
	}
	return &ProductReviewsResult{
		Reviews:    reviews,
		AvgRating:  avg,
		TotalCount: total,
	}, nil
}

// Delete removes a review; only the owning user can delete. Returns error if not found or not owner.
func (s *service) Delete(ctx context.Context, reviewID uuid.UUID, userID uuid.UUID) error {
	return s.repo.Delete(ctx, reviewID, userID)
}
