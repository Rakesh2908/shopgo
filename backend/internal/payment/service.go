package payment

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/Rakesh2908/shopgo/internal/order"
	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v80"
	"github.com/stripe/stripe-go/v80/paymentintent"
	"github.com/stripe/stripe-go/v80/webhook"
)

// PaymentService defines payment operations such as Stripe PaymentIntent creation and webhooks.
type PaymentService interface {
	CreateIntent(ctx context.Context, userID uuid.UUID, amountCents int64, currency string) (clientSecret string, piID string, err error)
	HandleWebhook(payload []byte, sigHeader string) error
}

// paymentService implements PaymentService.
type paymentService struct {
	webhookSecret string
	orderSvc      order.OrderService
}

// NewPaymentService returns a new PaymentService.
func NewPaymentService(stripeSecretKey string, webhookSecret string, orderSvc order.OrderService) PaymentService {
	stripe.Key = stripeSecretKey
	return &paymentService{
		webhookSecret: webhookSecret,
		orderSvc:      orderSvc,
	}
}

// CreateIntent creates a Stripe PaymentIntent for the given amount and returns the client secret and intent ID.
func (s *paymentService) CreateIntent(ctx context.Context, userID uuid.UUID, amountCents int64, currency string) (string, string, error) {
	if userID == uuid.Nil {
		return "", "", errors.New("payment: missing user id")
	}
	if amountCents <= 0 {
		return "", "", errors.New("payment: amount must be > 0")
	}
	if currency == "" {
		currency = "usd"
	}
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(amountCents),
		Currency: stripe.String(currency),
		Metadata: map[string]string{
			"userID": userID.String(),
		},
	}
	pi, err := paymentintent.New(params)
	if err != nil {
		return "", "", fmt.Errorf("payment: create payment intent: %w", err)
	}
	if pi == nil || pi.ClientSecret == "" {
		return "", "", errors.New("payment: missing client secret")
	}
	return pi.ClientSecret, pi.ID, nil
}

// HandleWebhook verifies and handles Stripe webhook events.
func (s *paymentService) HandleWebhook(payload []byte, sigHeader string) error {
	if s.webhookSecret == "" {
		return errors.New("payment: missing webhook secret")
	}
	event, err := webhook.ConstructEvent(payload, sigHeader, s.webhookSecret)
	if err != nil {
		return fmt.Errorf("payment: invalid webhook signature: %w", err)
	}

	switch event.Type {
	case "payment_intent.succeeded":
		var pi stripe.PaymentIntent
		if err := json.Unmarshal(event.Data.Raw, &pi); err != nil {
			return fmt.Errorf("payment: unmarshal payment intent: %w", err)
		}
		userIDStr := ""
		if pi.Metadata != nil {
			userIDStr = pi.Metadata["userID"]
		}
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			return fmt.Errorf("payment: invalid user id metadata: %w", err)
		}
		return s.orderSvc.CreateFromPaymentIntent(context.Background(), pi.ID, userID)

	case "payment_intent.payment_failed":
		var pi stripe.PaymentIntent
		if err := json.Unmarshal(event.Data.Raw, &pi); err != nil {
			return fmt.Errorf("payment: unmarshal payment intent: %w", err)
		}
		return s.orderSvc.MarkFailed(context.Background(), pi.ID)

	default:
		return nil
	}
}
