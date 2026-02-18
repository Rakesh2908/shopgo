package auth

import (
	"net/http"
	"strings"

	"github.com/Rakesh2908/shopgo/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ContextKeyUserID is the gin context key for the authenticated user's ID.
const ContextKeyUserID = "userID"

// JWTMiddleware returns a gin handler that validates the Bearer token and sets userID in context.
// Returns 401 if the Authorization header is missing or the token is invalid.
func JWTMiddleware(svc AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing authorization header")
			c.Abort()
			return
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "invalid authorization format")
			c.Abort()
			return
		}
		tokenString := parts[1]
		userID, err := svc.ParseAccessToken(tokenString)
		if err != nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "invalid or expired token")
			c.Abort()
			return
		}
		c.Set(ContextKeyUserID, userID)
		c.Next()
	}
}

// GetUserIDFromContext returns the user ID from gin context set by JWTMiddleware.
// Call only after JWTMiddleware has run. Returns uuid.Nil if not set.
func GetUserIDFromContext(c *gin.Context) uuid.UUID {
	v, exists := c.Get(ContextKeyUserID)
	if !exists {
		return uuid.Nil
	}
	id, _ := v.(uuid.UUID)
	return id
}
