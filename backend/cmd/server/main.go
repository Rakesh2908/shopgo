package main

import (
	"log"
	"strings"
	"time"

	"github.com/Rakesh2908/shopgo/internal/auth"
	"github.com/Rakesh2908/shopgo/internal/cart"
	"github.com/Rakesh2908/shopgo/internal/order"
	"github.com/Rakesh2908/shopgo/internal/payment"
	"github.com/Rakesh2908/shopgo/internal/product"
	"github.com/Rakesh2908/shopgo/internal/review"
	"github.com/Rakesh2908/shopgo/internal/wishlist"
	"github.com/Rakesh2908/shopgo/pkg/cache"
	"github.com/Rakesh2908/shopgo/pkg/config"
	"github.com/Rakesh2908/shopgo/pkg/database"
	"github.com/Rakesh2908/shopgo/pkg/response"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v80"
)

const (
	defaultFakestoreURL = "https://fakestoreapi.com"
	defaultPort         = "8080"
	cacheExpiry         = time.Minute
)

func main() {
	cfg := config.Load()
	dsn := cfg.DatabaseURL
	if cfg.DatabasePoolerURL != "" {
		dsn = cfg.DatabasePoolerURL
	}
	db := database.Connect(dsn)
	database.Migrate(db)

	memCache := cache.NewMemoryCache(cacheExpiry)

	if cfg.Environment != "development" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	if err := r.SetTrustedProxies(nil); err != nil {
		log.Printf("gin: SetTrustedProxies: %v", err)
	}

	origins := splitTrim(cfg.CORSAllowedOrigins, ",")
	if len(origins) == 0 {
		origins = []string{"http://localhost:5173"}
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	stripe.Key = cfg.StripeSecretKey

	authRepo := auth.NewAuthRepository(db)
	authSvc := auth.NewAuthService(authRepo, cfg)
	jwtMiddleware := auth.JWTMiddleware(authSvc)

	fakestoreURL := cfg.FakestoreBaseURL
	if fakestoreURL == "" {
		fakestoreURL = defaultFakestoreURL
	}
	productClient := product.NewClient(fakestoreURL)
	productSvc := product.NewProductService(productClient, memCache)

	cartRepo := cart.NewRepository(db)
	cartSvc := cart.NewService(cartRepo, productSvc)

	orderRepo := order.NewRepository(db)
	orderSvc := order.NewService(orderRepo, cartSvc, productSvc)

	paymentSvc := payment.NewPaymentService(cfg.StripeSecretKey, cfg.StripeWebhookSecret, orderSvc)

	wishlistRepo := wishlist.NewRepository(db)
	wishlistSvc := wishlist.NewService(wishlistRepo, productSvc)

	reviewRepo := review.NewRepository(db)
	reviewSvc := review.NewService(reviewRepo, productSvc)

	v1 := r.Group("/api/v1")
	auth.RegisterRoutes(v1.Group("/auth"), authSvc, jwtMiddleware)
	productsGroup := v1.Group("/products")
	product.RegisterRoutes(productsGroup, productSvc)
	cart.RegisterRoutes(v1.Group("/cart"), cartSvc, jwtMiddleware)
	order.RegisterRoutes(v1.Group("/orders"), orderSvc, jwtMiddleware)
	payment.RegisterRoutes(v1, paymentSvc, cartSvc, jwtMiddleware)
	wishlist.RegisterRoutes(v1.Group("/wishlist"), wishlistSvc, jwtMiddleware)
	review.RegisterRoutes(v1, productsGroup, reviewSvc, jwtMiddleware)

	r.GET("/health", func(c *gin.Context) {
		response.Success(c, 200, gin.H{
			"status":    "ok",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})

	port := cfg.Port
	if port == "" {
		port = defaultPort
	}
	log.Fatal(r.Run(":" + port))
}

// splitTrim splits s by sep and returns non-empty trimmed elements.
func splitTrim(s, sep string) []string {
	parts := strings.Split(s, sep)
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}
