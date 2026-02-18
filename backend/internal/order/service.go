package order

import (
	"context"
	"errors"
	"math"
	"time"

	"github.com/Rakesh2908/shopgo/internal/cart"
	"github.com/Rakesh2908/shopgo/internal/product"
	"github.com/google/uuid"
)

// OrderService defines the interface for order operations.
type OrderService interface {
	CreateFromPaymentIntent(ctx context.Context, piID string, userID uuid.UUID) error
	MarkFailed(ctx context.Context, piID string) error
	GetUserOrders(ctx context.Context, userID uuid.UUID) ([]Order, error)
	GetOrderByID(ctx context.Context, orderID uuid.UUID, userID uuid.UUID) (*Order, error)
}

// service implements OrderService.
type service struct {
	repo    Repository
	cart    cart.Service
	product product.ProductService
}

// NewService returns a new OrderService.
func NewService(repo Repository, cartSvc cart.Service, productSvc product.ProductService) OrderService {
	return &service{repo: repo, cart: cartSvc, product: productSvc}
}

// CreateFromPaymentIntent creates an order from the user's current cart.
// This is intended to be called after Stripe confirms the PaymentIntent succeeded.
func (s *service) CreateFromPaymentIntent(ctx context.Context, piID string, userID uuid.UUID) error {
	if userID == uuid.Nil {
		return errors.New("order: missing user id")
	}
	if piID == "" {
		return errors.New("order: missing payment intent id")
	}

	// Idempotency: webhooks can be delivered multiple times.
	existing, err := s.repo.GetByStripePIID(ctx, piID)
	if err != nil {
		return err
	}
	if existing != nil && existing.Status == "paid" {
		return nil
	}

	cartItems, err := s.cart.GetCart(ctx, userID)
	if err != nil {
		return err
	}
	if len(cartItems) == 0 {
		// If the cart is empty, avoid creating a meaningless order. Treat as idempotent/no-op.
		return nil
	}

	now := time.Now()
	order := &Order{
		UserID:     userID,
		StripePIID: piID,
		Status:     "paid",
		Currency:   "usd",
		CreatedAt:  now,
	}

	var totalCents int
	items := make([]OrderItem, 0, len(cartItems))
	for _, ci := range cartItems {
		// Snapshot the product details at purchase time.
		p, err := s.product.GetByID(ctx, ci.ProductID)
		if err != nil || p == nil {
			return errors.New("order: failed to load product for cart item")
		}
		priceCents := int(math.Round(p.Price * 100))
		if priceCents < 0 {
			priceCents = 0
		}
		lineTotal := priceCents * ci.Quantity
		if lineTotal < 0 {
			lineTotal = 0
		}
		totalCents += lineTotal
		items = append(items, OrderItem{
			ProductID:  p.ID,
			Title:      p.Title,
			PriceCents: priceCents,
			Quantity:   ci.Quantity,
			ImageURL:   p.Image,
		})
	}
	order.TotalCents = totalCents
	order.OrderItems = items

	if existing != nil {
		// If an order already exists for this PI, treat this as a state update.
		existing.Status = "paid"
		if existing.TotalCents == 0 {
			existing.TotalCents = order.TotalCents
		}
		if existing.Currency == "" {
			existing.Currency = order.Currency
		}
		if len(existing.OrderItems) == 0 {
			existing.OrderItems = order.OrderItems
		}
		if err := s.repo.Update(ctx, existing); err != nil {
			return err
		}
	} else {
		if err := s.repo.Create(ctx, order); err != nil {
			return err
		}
	}

	// Clear cart after order creation.
	if err := s.cart.ClearCart(ctx, userID); err != nil {
		return err
	}
	return nil
}

// MarkFailed marks an order associated with the given PaymentIntent as failed.
// If no order exists yet, it returns nil (idempotent for webhook retries/out-of-order events).
func (s *service) MarkFailed(ctx context.Context, piID string) error {
	if piID == "" {
		return nil
	}
	existing, err := s.repo.GetByStripePIID(ctx, piID)
	if err != nil {
		return err
	}
	if existing == nil {
		return nil
	}
	if existing.Status == "failed" {
		return nil
	}
	existing.Status = "failed"
	return s.repo.Update(ctx, existing)
}

// GetUserOrders returns all orders for the given user.
func (s *service) GetUserOrders(ctx context.Context, userID uuid.UUID) ([]Order, error) {
	if userID == uuid.Nil {
		return nil, errors.New("order: missing user id")
	}
	return s.repo.GetByUserID(ctx, userID)
}

// GetOrderByID returns a single order if it belongs to the user.
func (s *service) GetOrderByID(ctx context.Context, orderID uuid.UUID, userID uuid.UUID) (*Order, error) {
	if orderID == uuid.Nil {
		return nil, errors.New("order: missing order id")
	}
	if userID == uuid.Nil {
		return nil, errors.New("order: missing user id")
	}
	o, err := s.repo.GetByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if o == nil {
		return nil, nil
	}
	if o.UserID != userID {
		// treat as not found to avoid leaking existence
		return nil, nil
	}
	return o, nil
}
