package order

import (
	"time"

	"github.com/Rakesh2908/shopgo/internal/user"
	"github.com/google/uuid"
)

// Order represents a customer order.
type Order struct {
	ID         uuid.UUID   `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID   `gorm:"type:uuid;not null;index" json:"-"`
	StripePIID string      `gorm:"column:stripe_pi_id" json:"stripePiId"`
	Status     string      `gorm:"not null;default:pending" json:"status"`
	TotalCents int         `gorm:"not null" json:"totalCents"`
	Currency   string      `gorm:"not null;default:usd" json:"currency"`
	CreatedAt  time.Time   `gorm:"not null" json:"createdAt"`
	User       user.User   `gorm:"foreignKey:UserID;references:ID" json:"-"`
	OrderItems []OrderItem `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"items"`
}

// TableName overrides the table name for Order.
func (Order) TableName() string {
	return "orders"
}

// OrderItem represents a line item in an order.
type OrderItem struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	OrderID    uuid.UUID `gorm:"type:uuid;not null;index" json:"-"`
	ProductID  int       `gorm:"not null" json:"productId"`
	Title      string    `gorm:"not null" json:"title"`
	PriceCents int       `gorm:"not null" json:"priceCents"`
	Quantity   int       `gorm:"not null" json:"quantity"`
	ImageURL   string    `gorm:"column:image_url" json:"imageUrl"`
	Order      Order     `gorm:"foreignKey:OrderID;references:ID;constraint:OnDelete:CASCADE" json:"-"`
}

// TableName overrides the table name for OrderItem.
func (OrderItem) TableName() string {
	return "order_items"
}
