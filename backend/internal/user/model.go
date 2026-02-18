package user

import (
	"time"

	"github.com/google/uuid"
)

// User is the user domain model for GORM.
type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	FullName  string    `gorm:"not null" json:"fullName"`
	CreatedAt time.Time `gorm:"not null" json:"createdAt"`
	UpdatedAt time.Time `gorm:"not null" json:"updatedAt"`
}

// TableName overrides the table name for User.
func (User) TableName() string {
	return "users"
}

// RefreshToken stores hashed refresh tokens for user sessions.
type RefreshToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`
	TokenHash string    `gorm:"not null"`
	ExpiresAt time.Time `gorm:"not null"`
	CreatedAt time.Time `gorm:"not null"`
	User      User      `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
}

// TableName overrides the table name for RefreshToken.
func (RefreshToken) TableName() string {
	return "refresh_tokens"
}
