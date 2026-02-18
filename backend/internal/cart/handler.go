package cart

import (
	"net/http"
	"strings"

	"github.com/Rakesh2908/shopgo/internal/auth"
	"github.com/Rakesh2908/shopgo/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// AddItemRequest is the request body for POST /cart.
type AddItemRequest struct {
	ProductID int `json:"productID" binding:"required,min=1"`
	Quantity  int `json:"quantity" binding:"required,min=1"`
}

// UpdateQuantityRequest is the request body for PATCH /cart/:id.
type UpdateQuantityRequest struct {
	Quantity int `json:"quantity" binding:"required,min=1"`
}

// MergeCartRequest is the request body for POST /cart/merge.
type MergeCartRequest struct {
	Items []GuestCartItemRequest `json:"items" binding:"required,dive"`
}

// GuestCartItemRequest is a single item in the merge request.
type GuestCartItemRequest struct {
	ProductID int `json:"productID" binding:"required,min=1"`
	Quantity  int `json:"quantity" binding:"required,min=1"`
}

// RegisterRoutes registers cart routes on the given router group. All routes require JWT auth.
// Expects the group to be mounted at /cart (e.g. api.Group("/cart")) so routes are POST/GET /cart, PATCH/DELETE /cart/:id, etc.
func RegisterRoutes(rg *gin.RouterGroup, svc Service, authMiddleware gin.HandlerFunc) {
	rg.Use(authMiddleware)
	rg.POST("", handleAddItem(svc))
	rg.GET("", handleGetCart(svc))
	rg.PATCH("/:id", handleUpdateQuantity(svc))
	rg.DELETE("/:id", handleRemoveItem(svc))
	rg.DELETE("", handleClearCart(svc))
	rg.POST("/merge", handleMergeGuestCart(svc))
}

func handleAddItem(svc Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := auth.GetUserIDFromContext(c)
		if userID == uuid.Nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing user context")
			return
		}
		var req AddItemRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", validationMessage(err))
			return
		}
		item, err := svc.AddItem(c.Request.Context(), userID, req.ProductID, req.Quantity)
		if err != nil {
			if strings.Contains(err.Error(), "product not found") {
				response.Error(c, http.StatusNotFound, "PRODUCT_NOT_FOUND", "product not found")
				return
			}
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to add item")
			return
		}
		response.Success(c, http.StatusCreated, item)
	}
}

func handleGetCart(svc Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := auth.GetUserIDFromContext(c)
		if userID == uuid.Nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing user context")
			return
		}
		items, err := svc.GetCart(c.Request.Context(), userID)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to get cart")
			return
		}
		response.Success(c, http.StatusOK, items)
	}
}

func handleUpdateQuantity(svc Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := auth.GetUserIDFromContext(c)
		if userID == uuid.Nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing user context")
			return
		}
		idStr := c.Param("id")
		itemID, err := uuid.Parse(idStr)
		if err != nil {
			response.Error(c, http.StatusBadRequest, "INVALID_ID", "invalid cart item id")
			return
		}
		var req UpdateQuantityRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", validationMessage(err))
			return
		}
		if err := svc.UpdateQuantity(c.Request.Context(), userID, itemID, req.Quantity); err != nil {
			if err.Error() == "cart: item not found" {
				response.Error(c, http.StatusNotFound, "ITEM_NOT_FOUND", "cart item not found")
				return
			}
			if err.Error() == "cart: quantity must be at least 1" {
				response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "quantity must be at least 1")
				return
			}
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to update quantity")
			return
		}
		response.Success(c, http.StatusOK, gin.H{"updated": true})
	}
}

func handleRemoveItem(svc Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := auth.GetUserIDFromContext(c)
		if userID == uuid.Nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing user context")
			return
		}
		idStr := c.Param("id")
		itemID, err := uuid.Parse(idStr)
		if err != nil {
			response.Error(c, http.StatusBadRequest, "INVALID_ID", "invalid cart item id")
			return
		}
		if err := svc.RemoveItem(c.Request.Context(), userID, itemID); err != nil {
			if err.Error() == "cart: item not found" {
				response.Error(c, http.StatusNotFound, "ITEM_NOT_FOUND", "cart item not found")
				return
			}
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to remove item")
			return
		}
		response.Success(c, http.StatusOK, gin.H{"deleted": true})
	}
}

func handleClearCart(svc Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := auth.GetUserIDFromContext(c)
		if userID == uuid.Nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing user context")
			return
		}
		if err := svc.ClearCart(c.Request.Context(), userID); err != nil {
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to clear cart")
			return
		}
		response.Success(c, http.StatusOK, gin.H{"cleared": true})
	}
}

func handleMergeGuestCart(svc Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := auth.GetUserIDFromContext(c)
		if userID == uuid.Nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing user context")
			return
		}
		var req MergeCartRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", validationMessage(err))
			return
		}
		items := make([]GuestCartItem, len(req.Items))
		for i := range req.Items {
			items[i] = GuestCartItem{
				ProductID: req.Items[i].ProductID,
				Quantity:  req.Items[i].Quantity,
			}
		}
		if err := svc.MergeGuestCart(c.Request.Context(), userID, items); err != nil {
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to merge cart")
			return
		}
		response.Success(c, http.StatusOK, gin.H{"merged": true})
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
