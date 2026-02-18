package order

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Repository defines the interface for order persistence.
type Repository interface {
	Create(ctx context.Context, order *Order) error
	GetByID(ctx context.Context, id uuid.UUID) (*Order, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]Order, error)
	GetByStripePIID(ctx context.Context, piID string) (*Order, error)
	Update(ctx context.Context, order *Order) error
}

// repository implements Repository using GORM.
type repository struct {
	db *gorm.DB
}

// NewRepository returns a new order Repository.
func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

// Create inserts a new order with its items.
func (r *repository) Create(ctx context.Context, order *Order) error {
	return r.db.WithContext(ctx).Create(order).Error
}

// GetByID returns an order by ID with items.
func (r *repository) GetByID(ctx context.Context, id uuid.UUID) (*Order, error) {
	var o Order
	err := r.db.WithContext(ctx).Preload("OrderItems").Where("id = ?", id).First(&o).Error
	if err != nil {
		return nil, err
	}
	return &o, nil
}

// GetByUserID returns all orders for a user.
func (r *repository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]Order, error) {
	var orders []Order
	err := r.db.WithContext(ctx).Preload("OrderItems").Where("user_id = ?", userID).Order("created_at DESC").Find(&orders).Error
	return orders, err
}

// GetByStripePIID returns an order by Stripe PaymentIntent ID, or nil if not found.
func (r *repository) GetByStripePIID(ctx context.Context, piID string) (*Order, error) {
	if piID == "" {
		return nil, nil
	}
	var o Order
	err := r.db.WithContext(ctx).Preload("OrderItems").Where("stripe_pi_id = ?", piID).First(&o).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &o, nil
}

// Update saves an existing order.
func (r *repository) Update(ctx context.Context, order *Order) error {
	return r.db.WithContext(ctx).Save(order).Error
}
