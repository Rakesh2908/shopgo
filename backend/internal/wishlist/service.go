package wishlist

import (
	"context"
	"fmt"

	"github.com/Rakesh2908/shopgo/internal/product"
	"github.com/google/uuid"
)

// WishlistItemResponse is the API response for a wishlist item with product details.
type WishlistItemResponse struct {
	ItemID    uuid.UUID `json:"itemID"`
	ProductID int       `json:"productID"`
	Title     string    `json:"title"`
	Image     string    `json:"image"`
	Price     float64   `json:"price"`
}

// Service defines the interface for wishlist operations.
type Service interface {
	Toggle(ctx context.Context, userID uuid.UUID, productID int) (added bool, err error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]WishlistItemResponse, error)
}

// service implements Service.
type service struct {
	repo    Repository
	product product.ProductService
}

// NewService returns a new wishlist Service.
func NewService(repo Repository, product product.ProductService) Service {
	return &service{repo: repo, product: product}
}

// Toggle adds or removes a product from the user's wishlist. Returns added=true when added, false when removed.
func (s *service) Toggle(ctx context.Context, userID uuid.UUID, productID int) (added bool, err error) {
	_, err = s.product.GetByID(ctx, productID)
	if err != nil {
		return false, fmt.Errorf("wishlist: product not found: %w", err)
	}
	return s.repo.Toggle(ctx, userID, productID)
}

// GetByUserID returns wishlist items with product data (title, image, price) for the user.
func (s *service) GetByUserID(ctx context.Context, userID uuid.UUID) ([]WishlistItemResponse, error) {
	items, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]WishlistItemResponse, 0, len(items))
	for _, item := range items {
		p, err := s.product.GetByID(ctx, item.ProductID)
		if err != nil {
			continue
		}
		out = append(out, WishlistItemResponse{
			ItemID:    item.ID,
			ProductID: item.ProductID,
			Title:     p.Title,
			Image:     p.Image,
			Price:     p.Price,
		})
	}
	return out, nil
}
