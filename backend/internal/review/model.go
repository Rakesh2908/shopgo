package review

import (
	"time"

	"github.com/Rakesh2908/shopgo/internal/user"
	"github.com/google/uuid"
)

// Review represents a user's product review.
type Review struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_review_user_product"`
	ProductID int       `gorm:"not null;uniqueIndex:idx_review_user_product"`
	Rating    int       `gorm:"not null;check:rating >= 1 AND rating <= 5"`
	Comment   string    `gorm:"type:text"`
	CreatedAt time.Time `gorm:"not null"`
	User      user.User `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
}

// TableName overrides the table name for Review.
func (Review) TableName() string {
	return "reviews"
}
