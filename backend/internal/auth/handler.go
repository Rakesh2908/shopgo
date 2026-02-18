package auth

import (
	"net/http"
	"strings"

	"github.com/Rakesh2908/shopgo/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// Cookie name for refresh token.
const RefreshTokenCookieName = "refresh_token"

// RegisterRequest is the request body for POST /auth/register.
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	FullName string `json:"fullName" binding:"required"`
}

// LoginRequest is the request body for POST /auth/login.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RegisterRoutes registers auth routes on the given router group.
func RegisterRoutes(rg *gin.RouterGroup, svc AuthService, authMiddleware gin.HandlerFunc) {
	rg.POST("/register", handleRegister(svc))
	rg.POST("/login", handleLogin(svc))
	rg.POST("/refresh", handleRefresh(svc))
	rg.POST("/logout", handleLogout(svc))
	rg.GET("/me", authMiddleware, handleMe(svc))
}

func handleRegister(svc AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", validationMessage(err))
			return
		}
		user, err := svc.Register(c.Request.Context(), req.Email, req.Password, req.FullName)
		if err != nil {
			if err.Error() == "auth: email already registered" {
				response.Error(c, http.StatusConflict, "EMAIL_EXISTS", "email already registered")
				return
			}
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "registration failed")
			return
		}
		response.Success(c, http.StatusCreated, user)
	}
}

func handleLogin(svc AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", validationMessage(err))
			return
		}
		accessToken, refreshCookieValue, err := svc.Login(c.Request.Context(), req.Email, req.Password)
		if err != nil {
			response.Error(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "invalid email or password")
			return
		}
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     RefreshTokenCookieName,
			Value:    refreshCookieValue,
			Path:     "/",
			MaxAge:   7 * 24 * 3600,
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
		})
		response.Success(c, http.StatusOK, gin.H{"accessToken": accessToken})
	}
}

func handleRefresh(svc AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		refreshCookieValue, err := c.Cookie(RefreshTokenCookieName)
		if err != nil || refreshCookieValue == "" {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing refresh token")
			return
		}
		accessToken, err := svc.RefreshToken(c.Request.Context(), refreshCookieValue)
		if err != nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "invalid or expired refresh token")
			return
		}
		response.Success(c, http.StatusOK, gin.H{"accessToken": accessToken})
	}
}

func handleLogout(svc AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		refreshCookieValue, _ := c.Cookie(RefreshTokenCookieName)
		if refreshCookieValue != "" {
			_ = svc.Logout(c.Request.Context(), refreshCookieValue)
		}
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     RefreshTokenCookieName,
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
		})
		response.Success(c, http.StatusOK, nil)
	}
}

func handleMe(svc AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := GetUserIDFromContext(c)
		if userID == uuid.Nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "not authenticated")
			return
		}
		u, err := svc.Me(c.Request.Context(), userID)
		if err != nil {
			response.Error(c, http.StatusNotFound, "NOT_FOUND", "user not found")
			return
		}
		response.Success(c, http.StatusOK, u)
	}
}

func validationMessage(err error) string {
	if err == nil {
		return ""
	}
	if ve, ok := err.(validator.ValidationErrors); ok && len(ve) > 0 {
		f := ve[0]
		return strings.ToLower(f.Field()) + " " + f.Tag()
	}
	return err.Error()
}
