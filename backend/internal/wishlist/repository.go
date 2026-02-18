package wishlist

import (
	"context"
	"time"

	"github.com/Rakesh2908/shopgo/internal/user"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WishlistItem represents a product on a user's wishlist.
type WishlistItem struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_wishlist_user_product"`
	ProductID int       `gorm:"not null;uniqueIndex:idx_wishlist_user_product"`
	CreatedAt time.Time `gorm:"not null"`
	User      user.User `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
}

// TableName overrides the table name for WishlistItem.
func (WishlistItem) TableName() string {
	return "wishlist_items"
}

// Repository defines the interface for wishlist item persistence.
type Repository interface {
	Toggle(ctx context.Context, userID uuid.UUID, productID int) (added bool, err error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]WishlistItem, error)
	Create(ctx context.Context, item *WishlistItem) error
	GetByUserIDAndProductID(ctx context.Context, userID uuid.UUID, productID int) (*WishlistItem, error)
	Delete(ctx context.Context, id uuid.UUID) error
	DeleteByUserIDAndProductID(ctx context.Context, userID uuid.UUID, productID int) error
}

// repository implements Repository using GORM.
type repository struct {
	db *gorm.DB
}

// NewRepository returns a new wishlist Repository.
func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

// Toggle adds the product to the wishlist if not present, or removes it if present.
// Returns added=true when the item was inserted, added=false when it was deleted.
func (r *repository) Toggle(ctx context.Context, userID uuid.UUID, productID int) (added bool, err error) {
	existing, err := r.GetByUserIDAndProductID(ctx, userID, productID)
	if err != nil {
		return false, err
	}
	if existing != nil {
		if err := r.DeleteByUserIDAndProductID(ctx, userID, productID); err != nil {
			return false, err
		}
		return false, nil
	}
	item := &WishlistItem{
		UserID:    userID,
		ProductID: productID,
		CreatedAt: time.Now(),
	}
	if err := r.Create(ctx, item); err != nil {
		return false, err
	}
	return true, nil
}

// Create inserts a new wishlist item.
func (r *repository) Create(ctx context.Context, item *WishlistItem) error {
	return r.db.WithContext(ctx).Create(item).Error
}

// GetByUserID returns all wishlist items for a user.
func (r *repository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]WishlistItem, error) {
	var items []WishlistItem
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&items).Error
	return items, err
}

// GetByUserIDAndProductID returns the wishlist item for a user and product, or nil if not found.
func (r *repository) GetByUserIDAndProductID(ctx context.Context, userID uuid.UUID, productID int) (*WishlistItem, error) {
	var item WishlistItem
	err := r.db.WithContext(ctx).Where("user_id = ? AND product_id = ?", userID, productID).First(&item).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// Delete removes a wishlist item by ID.
func (r *repository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&WishlistItem{}, "id = ?", id).Error
}

// DeleteByUserIDAndProductID removes the wishlist item for a user and product.
func (r *repository) DeleteByUserIDAndProductID(ctx context.Context, userID uuid.UUID, productID int) error {
	return r.db.WithContext(ctx).Where("user_id = ? AND product_id = ?", userID, productID).Delete(&WishlistItem{}).Error
}
