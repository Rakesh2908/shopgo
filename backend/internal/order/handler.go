package order

import (
	"net/http"

	"github.com/Rakesh2908/shopgo/internal/auth"
	"github.com/Rakesh2908/shopgo/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RegisterRoutes registers order routes on the given router group. All routes require JWT auth.
// Expects the group to be mounted at /orders (e.g. api.Group("/orders")).
func RegisterRoutes(rg *gin.RouterGroup, svc OrderService, authMiddleware gin.HandlerFunc) {
	rg.Use(authMiddleware)
	rg.GET("", handleListOrders(svc))
	rg.GET("/:id", handleGetOrder(svc))
}

func handleListOrders(svc OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := auth.GetUserIDFromContext(c)
		if userID == uuid.Nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing user context")
			return
		}
		orders, err := svc.GetUserOrders(c.Request.Context(), userID)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to fetch orders")
			return
		}
		response.Success(c, http.StatusOK, orders)
	}
}

func handleGetOrder(svc OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := auth.GetUserIDFromContext(c)
		if userID == uuid.Nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing user context")
			return
		}
		idStr := c.Param("id")
		orderID, err := uuid.Parse(idStr)
		if err != nil {
			response.Error(c, http.StatusBadRequest, "INVALID_ID", "invalid order id")
			return
		}
		o, err := svc.GetOrderByID(c.Request.Context(), orderID, userID)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to fetch order")
			return
		}
		if o == nil {
			response.Error(c, http.StatusNotFound, "NOT_FOUND", "order not found")
			return
		}
		response.Success(c, http.StatusOK, o)
	}
}
