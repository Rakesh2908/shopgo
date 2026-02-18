package wishlist

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/Rakesh2908/shopgo/internal/auth"
	"github.com/Rakesh2908/shopgo/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RegisterRoutes registers wishlist routes on the given router group. All routes require JWT auth.
// Group path should be "/wishlist" so routes are POST /wishlist/:productID, GET /wishlist.
func RegisterRoutes(rg *gin.RouterGroup, svc Service, authMiddleware gin.HandlerFunc) {
	rg.Use(authMiddleware)
	rg.POST("/:productID", handleToggle(svc))
	rg.GET("", handleGetWishlist(svc))
}

// handleToggle handles POST /wishlist/:productID — toggles product in wishlist, returns { added, productID }.
func handleToggle(svc Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := auth.GetUserIDFromContext(c)
		if userID == uuid.Nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing user context")
			return
		}
		productIDStr := c.Param("productID")
		productID, err := strconv.Atoi(productIDStr)
		if err != nil || productID < 1 {
			response.Error(c, http.StatusBadRequest, "INVALID_ID", "invalid product id")
			return
		}
		added, err := svc.Toggle(c.Request.Context(), userID, productID)
		if err != nil {
			if strings.Contains(err.Error(), "product not found") {
				response.Error(c, http.StatusNotFound, "PRODUCT_NOT_FOUND", "product not found")
				return
			}
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to toggle wishlist")
			return
		}
		response.Success(c, http.StatusOK, gin.H{
			"added":     added,
			"productID": productID,
		})
	}
}

// handleGetWishlist handles GET /wishlist — returns list of wishlist items with product data.
func handleGetWishlist(svc Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := auth.GetUserIDFromContext(c)
		if userID == uuid.Nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing user context")
			return
		}
		items, err := svc.GetByUserID(c.Request.Context(), userID)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to get wishlist")
			return
		}
		response.Success(c, http.StatusOK, items)
	}
}
