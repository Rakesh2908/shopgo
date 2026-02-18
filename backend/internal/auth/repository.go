package auth

import (
	"context"
	"time"

	"github.com/Rakesh2908/shopgo/internal/user"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuthRepository defines the interface for auth-related persistence.
type AuthRepository interface {
	CreateUser(ctx context.Context, u *user.User) error
	FindUserByEmail(ctx context.Context, email string) (*user.User, error)
	FindUserByID(ctx context.Context, id uuid.UUID) (*user.User, error)
	CreateRefreshToken(ctx context.Context, rt *user.RefreshToken) error
	FindRefreshTokenByID(ctx context.Context, id uuid.UUID) (*user.RefreshToken, error)
	FindRefreshTokenByUserID(ctx context.Context, userID uuid.UUID) ([]user.RefreshToken, error)
	DeleteRefreshToken(ctx context.Context, id uuid.UUID) error
	DeleteExpiredTokens(ctx context.Context) error
}

// gormAuthRepository implements AuthRepository using GORM.
type gormAuthRepository struct {
	db *gorm.DB
}

// NewAuthRepository returns a new AuthRepository backed by GORM.
func NewAuthRepository(db *gorm.DB) AuthRepository {
	return &gormAuthRepository{db: db}
}

// CreateUser inserts a new user.
func (r *gormAuthRepository) CreateUser(ctx context.Context, u *user.User) error {
	return r.db.WithContext(ctx).Create(u).Error
}

// FindUserByEmail returns the user with the given email, or nil if not found.
func (r *gormAuthRepository) FindUserByEmail(ctx context.Context, email string) (*user.User, error) {
	var u user.User
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&u).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// FindUserByID returns the user with the given ID, or nil if not found.
func (r *gormAuthRepository) FindUserByID(ctx context.Context, id uuid.UUID) (*user.User, error) {
	var u user.User
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&u).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// CreateRefreshToken inserts a new refresh token record.
func (r *gormAuthRepository) CreateRefreshToken(ctx context.Context, rt *user.RefreshToken) error {
	return r.db.WithContext(ctx).Create(rt).Error
}

// FindRefreshTokenByID returns the refresh token by ID, or nil if not found.
func (r *gormAuthRepository) FindRefreshTokenByID(ctx context.Context, id uuid.UUID) (*user.RefreshToken, error) {
	var rt user.RefreshToken
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&rt).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &rt, nil
}

// FindRefreshTokenByUserID returns all unexpired refresh tokens for the user.
func (r *gormAuthRepository) FindRefreshTokenByUserID(ctx context.Context, userID uuid.UUID) ([]user.RefreshToken, error) {
	var tokens []user.RefreshToken
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND expires_at > ?", userID, time.Now()).
		Find(&tokens).Error
	if err != nil {
		return nil, err
	}
	return tokens, nil
}

// DeleteRefreshToken removes a refresh token by ID.
func (r *gormAuthRepository) DeleteRefreshToken(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&user.RefreshToken{}, "id = ?", id).Error
}

// DeleteExpiredTokens removes all refresh tokens that have expired.
func (r *gormAuthRepository) DeleteExpiredTokens(ctx context.Context) error {
	return r.db.WithContext(ctx).Where("expires_at <= ?", time.Now()).Delete(&user.RefreshToken{}).Error
}
