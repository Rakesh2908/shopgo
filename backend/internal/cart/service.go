package cart

import (
	"context"
	"errors"
	"fmt"

	"github.com/Rakesh2908/shopgo/internal/product"
	"github.com/google/uuid"
)

// CartItemResponse is the API response for a single cart line item with product details.
type CartItemResponse struct {
	ItemID    uuid.UUID `json:"itemID"`
	ProductID int       `json:"productID"`
	Title     string    `json:"title"`
	Image     string    `json:"image"`
	Price     float64   `json:"price"`
	Quantity  int       `json:"quantity"`
	Subtotal  float64   `json:"subtotal"`
}

// Service defines the interface for cart operations.
type Service interface {
	AddItem(ctx context.Context, userID uuid.UUID, productID int, quantity int) (*CartItem, error)
	GetCart(ctx context.Context, userID uuid.UUID) ([]CartItemResponse, error)
	UpdateQuantity(ctx context.Context, userID uuid.UUID, itemID uuid.UUID, quantity int) error
	RemoveItem(ctx context.Context, userID uuid.UUID, itemID uuid.UUID) error
	ClearCart(ctx context.Context, userID uuid.UUID) error
	MergeGuestCart(ctx context.Context, userID uuid.UUID, items []GuestCartItem) error
}

// service implements Service.
type service struct {
	repo    Repository
	product product.ProductService
}

// NewService returns a new cart Service.
func NewService(repo Repository, product product.ProductService) Service {
	return &service{repo: repo, product: product}
}

// AddItem validates the product exists, then upserts the cart item.
func (s *service) AddItem(ctx context.Context, userID uuid.UUID, productID int, quantity int) (*CartItem, error) {
	if quantity < 1 {
		return nil, errors.New("cart: quantity must be at least 1")
	}
	_, err := s.product.GetByID(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("cart: product not found: %w", err)
	}
	return s.repo.UpsertItem(ctx, userID, productID, quantity)
}

// GetCart returns cart items with live product details (title, image, price) and subtotals.
func (s *service) GetCart(ctx context.Context, userID uuid.UUID) ([]CartItemResponse, error) {
	items, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]CartItemResponse, 0, len(items))
	for _, item := range items {
		p, err := s.product.GetByID(ctx, item.ProductID)
		if err != nil {
			// Skip items whose product no longer exists, or return error per your preference
			continue
		}
		subtotal := p.Price * float64(item.Quantity)
		out = append(out, CartItemResponse{
			ItemID:    item.ID,
			ProductID: item.ProductID,
			Title:     p.Title,
			Image:     p.Image,
			Price:     p.Price,
			Quantity:  item.Quantity,
			Subtotal:  subtotal,
		})
	}
	return out, nil
}

// UpdateQuantity validates quantity >= 1 and that the item belongs to the user, then updates.
func (s *service) UpdateQuantity(ctx context.Context, userID uuid.UUID, itemID uuid.UUID, quantity int) error {
	if quantity < 1 {
		return errors.New("cart: quantity must be at least 1")
	}
	item, err := s.repo.GetByID(ctx, itemID)
	if err != nil {
		return err
	}
	if item == nil {
		return errors.New("cart: item not found")
	}
	if item.UserID != userID {
		return errors.New("cart: item not found")
	}
	return s.repo.UpdateQuantity(ctx, itemID, quantity)
}

// RemoveItem ensures the item belongs to the user, then deletes it.
func (s *service) RemoveItem(ctx context.Context, userID uuid.UUID, itemID uuid.UUID) error {
	item, err := s.repo.GetByID(ctx, itemID)
	if err != nil {
		return err
	}
	if item == nil {
		return errors.New("cart: item not found")
	}
	if item.UserID != userID {
		return errors.New("cart: item not found")
	}
	return s.repo.DeleteItem(ctx, itemID)
}

// ClearCart removes all items for the user.
func (s *service) ClearCart(ctx context.Context, userID uuid.UUID) error {
	return s.repo.ClearCart(ctx, userID)
}

// MergeGuestCart merges guest cart items into the user's cart (adds quantities).
func (s *service) MergeGuestCart(ctx context.Context, userID uuid.UUID, items []GuestCartItem) error {
	return s.repo.MergeGuestCart(ctx, userID, items)
}
