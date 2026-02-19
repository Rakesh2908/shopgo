package payment

import (
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/Rakesh2908/shopgo/internal/auth"
	"github.com/Rakesh2908/shopgo/internal/cart"
	"github.com/Rakesh2908/shopgo/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RegisterRoutes registers payment routes on the given router group.
// Expects the group to be mounted at / (e.g. api group), and registers:
// - POST /checkout/intent (protected)
// - POST /webhooks/stripe (public)
func RegisterRoutes(rg *gin.RouterGroup, svc PaymentService, cartSvc cart.Service, authMiddleware gin.HandlerFunc) {
	rg.POST("/webhooks/stripe", handleStripeWebhook(svc))

	protected := rg.Group("")
	protected.Use(authMiddleware)
	protected.POST("/checkout/intent", handleCreateIntent(svc, cartSvc))
}

func handleCreateIntent(svc PaymentService, cartSvc cart.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := auth.GetUserIDFromContext(c)
		if userID == uuid.Nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing user context")
			return
		}

		items, err := cartSvc.GetCart(c.Request.Context(), userID)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to get cart")
			return
		}
		var amountCents int64
		for _, it := range items {
			// Price is float64 dollars; subtotal already includes quantity.
			amountCents += int64(it.Subtotal * 100)
		}
		if amountCents <= 0 {
			response.Error(c, http.StatusBadRequest, "EMPTY_CART", "cart is empty")
			return
		}
		currency := "usd"
		clientSecret, _, err := svc.CreateIntent(c.Request.Context(), userID, amountCents, currency)
		if err != nil {
			if strings.Contains(err.Error(), "amount") {
				response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid amount")
				return
			}
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to create payment intent")
			return
		}
		response.Success(c, http.StatusOK, gin.H{
			"clientSecret": clientSecret,
			"amount":       amountCents,
			"currency":     currency,
		})
	}
}

func handleStripeWebhook(svc PaymentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		payload, err := io.ReadAll(c.Request.Body)
		if err != nil {
			response.Error(c, http.StatusBadRequest, "INVALID_BODY", "failed to read request body")
			return
		}
		sigHeader := c.GetHeader("Stripe-Signature")
		if sigHeader == "" {
			response.Error(c, http.StatusBadRequest, "MISSING_SIGNATURE", "missing Stripe-Signature header")
			return
		}
		if err := svc.HandleWebhook(payload, sigHeader); err != nil {
			log.Printf("stripe webhook error: %v", err)
			// Stripe expects non-2xx to retry; keep message generic.
			response.Error(c, http.StatusBadRequest, "WEBHOOK_ERROR", "invalid webhook")
			return
		}
		response.Success(c, http.StatusOK, gin.H{"received": true})
	}
}
