package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/Rakesh2908/shopgo/internal/user"
	"github.com/Rakesh2908/shopgo/pkg/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

const (
	bcryptCost       = 12
	accessTokenTTL  = 15 * time.Minute
	refreshTokenTTL = 7 * 24 * time.Hour
	refreshTokenSize = 32
	cookieSeparator  = ":"
)

// AuthService defines the interface for authentication operations.
type AuthService interface {
	Register(ctx context.Context, email, password, fullName string) (*user.User, error)
	Login(ctx context.Context, email, password string) (accessToken, refreshCookieValue string, err error)
	RefreshToken(ctx context.Context, refreshCookieValue string) (accessToken string, err error)
	Logout(ctx context.Context, refreshCookieValue string) error
	ParseAccessToken(tokenString string) (userID uuid.UUID, err error)
	Me(ctx context.Context, userID uuid.UUID) (*user.User, error)
}

// authService implements AuthService.
type authService struct {
	repo   AuthRepository
	config *config.Config
}

// NewAuthService returns a new AuthService.
func NewAuthService(repo AuthRepository, cfg *config.Config) AuthService {
	return &authService{repo: repo, config: cfg}
}

// Register creates a new user. Returns error if email already exists.
func (s *authService) Register(ctx context.Context, email, password, fullName string) (*user.User, error) {
	existing, err := s.repo.FindUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, fmt.Errorf("auth: email already registered")
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	u := &user.User{
		Email:     email,
		Password:  string(hashed),
		FullName:  fullName,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := s.repo.CreateUser(ctx, u); err != nil {
		return nil, err
	}
	return userWithoutPassword(u), nil
}

// Login authenticates the user and returns access token and refresh cookie value (id:rawToken).
func (s *authService) Login(ctx context.Context, email, password string) (accessToken, refreshCookieValue string, err error) {
	u, err := s.repo.FindUserByEmail(ctx, email)
	if err != nil {
		return "", "", err
	}
	if u == nil {
		return "", "", fmt.Errorf("auth: invalid email or password")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password)); err != nil {
		return "", "", fmt.Errorf("auth: invalid email or password")
	}
	accessToken, err = s.generateAccessToken(u.ID, u.Email)
	if err != nil {
		return "", "", err
	}
	rawRefresh := make([]byte, refreshTokenSize)
	if _, err := rand.Read(rawRefresh); err != nil {
		return "", "", err
	}
	rawHex := hex.EncodeToString(rawRefresh)
	hash, err := bcrypt.GenerateFromPassword([]byte(rawHex), bcryptCost)
	if err != nil {
		return "", "", err
	}
	ttl := refreshTokenTTL
	if s.config.JWTRefreshTTL != 0 {
		ttl = time.Duration(s.config.JWTRefreshTTL)
	}
	rt := &user.RefreshToken{
		UserID:    u.ID,
		TokenHash: string(hash),
		ExpiresAt: time.Now().Add(ttl),
		CreatedAt: time.Now(),
	}
	if err := s.repo.CreateRefreshToken(ctx, rt); err != nil {
		return "", "", err
	}
	refreshCookieValue = rt.ID.String() + cookieSeparator + rawHex
	return accessToken, refreshCookieValue, nil
}

// RefreshToken validates the refresh cookie and returns a new access token.
func (s *authService) RefreshToken(ctx context.Context, refreshCookieValue string) (string, error) {
	tokenID, rawToken, err := parseRefreshCookie(refreshCookieValue)
	if err != nil {
		return "", err
	}
	rt, err := s.repo.FindRefreshTokenByID(ctx, tokenID)
	if err != nil {
		return "", err
	}
	if rt == nil {
		return "", fmt.Errorf("auth: invalid refresh token")
	}
	if rt.ExpiresAt.Before(time.Now()) {
		return "", fmt.Errorf("auth: refresh token expired")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(rt.TokenHash), []byte(rawToken)); err != nil {
		return "", fmt.Errorf("auth: invalid refresh token")
	}
	return s.generateAccessToken(rt.UserID, "")
}

// Logout removes the refresh token from the database.
func (s *authService) Logout(ctx context.Context, refreshCookieValue string) error {
	tokenID, _, err := parseRefreshCookie(refreshCookieValue)
	if err != nil {
		return err
	}
	return s.repo.DeleteRefreshToken(ctx, tokenID)
}

// ParseAccessToken parses the JWT and returns the user ID. Returns error if invalid.
func (s *authService) ParseAccessToken(tokenString string) (uuid.UUID, error) {
	claims, err := s.parseJWT(tokenString)
	if err != nil {
		return uuid.Nil, err
	}
	id, err := uuid.Parse(claims.Subject)
	if err != nil {
		return uuid.Nil, fmt.Errorf("auth: invalid token subject")
	}
	return id, nil
}

// Me returns the current user by ID without the password field.
func (s *authService) Me(ctx context.Context, userID uuid.UUID) (*user.User, error) {
	u, err := s.repo.FindUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, fmt.Errorf("auth: user not found")
	}
	return userWithoutPassword(u), nil
}

// accessClaims holds JWT claims for access tokens.
type accessClaims struct {
	jwt.RegisteredClaims
	Email string `json:"email,omitempty"`
}

func (s *authService) generateAccessToken(userID uuid.UUID, email string) (string, error) {
	ttl := accessTokenTTL
	if s.config.JWTAccessTTL != 0 {
		ttl = time.Duration(s.config.JWTAccessTTL)
	}
	now := time.Now()
	claims := accessClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(now),
		},
		Email: email,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWTSecret))
}

func (s *authService) parseJWT(tokenString string) (*accessClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &accessClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("auth: unexpected signing method")
		}
		return []byte(s.config.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*accessClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("auth: invalid token")
	}
	return claims, nil
}

func parseRefreshCookie(value string) (tokenID uuid.UUID, rawToken string, err error) {
	idx := strings.Index(value, cookieSeparator)
	if idx == -1 {
		return uuid.Nil, "", fmt.Errorf("auth: invalid refresh cookie format")
	}
	idStr := value[:idx]
	rawToken = value[idx+len(cookieSeparator):]
	if idStr == "" || rawToken == "" {
		return uuid.Nil, "", fmt.Errorf("auth: invalid refresh cookie format")
	}
	tokenID, err = uuid.Parse(idStr)
	if err != nil {
		return uuid.Nil, "", fmt.Errorf("auth: invalid refresh cookie format")
	}
	return tokenID, rawToken, nil
}

func userWithoutPassword(u *user.User) *user.User {
	return &user.User{
		ID:        u.ID,
		Email:     u.Email,
		FullName:  u.FullName,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}
