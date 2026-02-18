package cart

import (
	"context"
	"time"

	"github.com/Rakesh2908/shopgo/internal/user"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CartItem represents a product in a user's cart.
type CartItem struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_cart_user_product"`
	ProductID int       `gorm:"not null;uniqueIndex:idx_cart_user_product"`
	Quantity  int       `gorm:"not null;check:quantity > 0"`
	CreatedAt time.Time `gorm:"not null"`
	User      user.User `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
}

// TableName overrides the table name for CartItem.
func (CartItem) TableName() string {
	return "cart_items"
}

// GuestCartItem represents a cart item from a guest session for merge.
type GuestCartItem struct {
	ProductID int
	Quantity  int
}

// Repository defines the interface for cart item persistence.
type Repository interface {
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]CartItem, error)
	GetByID(ctx context.Context, itemID uuid.UUID) (*CartItem, error)
	UpsertItem(ctx context.Context, userID uuid.UUID, productID int, quantity int) (*CartItem, error)
	UpdateQuantity(ctx context.Context, itemID uuid.UUID, quantity int) error
	DeleteItem(ctx context.Context, itemID uuid.UUID) error
	ClearCart(ctx context.Context, userID uuid.UUID) error
	MergeGuestCart(ctx context.Context, userID uuid.UUID, items []GuestCartItem) error
}

// repository implements Repository using GORM.
type repository struct {
	db *gorm.DB
}

// NewRepository returns a new cart Repository.
func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

// GetByUserID returns all cart items for a user.
func (r *repository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]CartItem, error) {
	var items []CartItem
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&items).Error
	return items, err
}

// GetByID returns a cart item by ID, or nil if not found.
func (r *repository) GetByID(ctx context.Context, itemID uuid.UUID) (*CartItem, error) {
	var item CartItem
	err := r.db.WithContext(ctx).Where("id = ?", itemID).First(&item).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// UpsertItem creates or updates a cart item for the user and product.
// If (userID, productID) exists, quantity is updated; otherwise a new item is inserted.
func (r *repository) UpsertItem(ctx context.Context, userID uuid.UUID, productID int, quantity int) (*CartItem, error) {
	var item CartItem
	err := r.db.WithContext(ctx).Where("user_id = ? AND product_id = ?", userID, productID).First(&item).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}
	if err == gorm.ErrRecordNotFound {
		item = CartItem{
			UserID:    userID,
			ProductID: productID,
			Quantity:  quantity,
			CreatedAt: time.Now(),
		}
		if err := r.db.WithContext(ctx).Create(&item).Error; err != nil {
			return nil, err
		}
		return &item, nil
	}
	item.Quantity = quantity
	if err := r.db.WithContext(ctx).Save(&item).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

// UpdateQuantity sets the quantity for a cart item by ID.
func (r *repository) UpdateQuantity(ctx context.Context, itemID uuid.UUID, quantity int) error {
	return r.db.WithContext(ctx).Model(&CartItem{}).Where("id = ?", itemID).Update("quantity", quantity).Error
}

// DeleteItem removes a cart item by ID.
func (r *repository) DeleteItem(ctx context.Context, itemID uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&CartItem{}, "id = ?", itemID).Error
}

// ClearCart removes all cart items for a user.
func (r *repository) ClearCart(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("user_id = ?", userID).Delete(&CartItem{}).Error
}

// MergeGuestCart merges guest cart items into the user's cart by upserting each item (adding quantities).
func (r *repository) MergeGuestCart(ctx context.Context, userID uuid.UUID, items []GuestCartItem) error {
	for _, gi := range items {
		var existing CartItem
		err := r.db.WithContext(ctx).Where("user_id = ? AND product_id = ?", userID, gi.ProductID).First(&existing).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			return err
		}
		if err == gorm.ErrRecordNotFound {
			item := CartItem{
				UserID:    userID,
				ProductID: gi.ProductID,
				Quantity:  gi.Quantity,
				CreatedAt: time.Now(),
			}
			if err := r.db.WithContext(ctx).Create(&item).Error; err != nil {
				return err
			}
			continue
		}
		existing.Quantity += gi.Quantity
		if err := r.db.WithContext(ctx).Save(&existing).Error; err != nil {
			return err
		}
	}
	return nil
}
