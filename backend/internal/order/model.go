package order

import (
	"time"

	"github.com/Rakesh2908/shopgo/internal/user"
	"github.com/google/uuid"
)

// Order represents a customer order.
type Order struct {
	ID         uuid.UUID   `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID     uuid.UUID   `gorm:"type:uuid;not null;index"`
	StripePIID string      `gorm:"column:stripe_pi_id"`
	Status     string      `gorm:"not null;default:pending"`
	TotalCents int         `gorm:"not null"`
	Currency   string      `gorm:"not null;default:usd"`
	CreatedAt  time.Time   `gorm:"not null"`
	User       user.User   `gorm:"foreignKey:UserID;references:ID"`
	OrderItems []OrderItem `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE"`
}

// TableName overrides the table name for Order.
func (Order) TableName() string {
	return "orders"
}

// OrderItem represents a line item in an order.
type OrderItem struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrderID    uuid.UUID `gorm:"type:uuid;not null;index"`
	ProductID  int       `gorm:"not null"`
	Title      string    `gorm:"not null"`
	PriceCents int       `gorm:"not null"`
	Quantity   int       `gorm:"not null"`
	ImageURL   string    `gorm:"column:image_url"`
	Order      Order     `gorm:"foreignKey:OrderID;references:ID;constraint:OnDelete:CASCADE"`
}

// TableName overrides the table name for OrderItem.
func (OrderItem) TableName() string {
	return "order_items"
}
