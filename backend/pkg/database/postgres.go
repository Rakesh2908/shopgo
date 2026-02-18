package database

import (
	"log"
	"net"
	"net/url"

	"github.com/Rakesh2908/shopgo/internal/cart"
	"github.com/Rakesh2908/shopgo/internal/order"
	"github.com/Rakesh2908/shopgo/internal/review"
	"github.com/Rakesh2908/shopgo/internal/user"
	"github.com/Rakesh2908/shopgo/internal/wishlist"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// dsnForceIPv4 rewrites dsn so the host is replaced by its IPv4 address if possible.
// This avoids "no route to host" when the hostname resolves to IPv6 and the network has no IPv6 route.
func dsnForceIPv4(dsn string) string {
	u, err := url.Parse(dsn)
	if err != nil {
		return dsn
	}
	host := u.Hostname()
	if host == "" || net.ParseIP(host) != nil {
		return dsn
	}
	ips, err := net.LookupIP(host)
	if err != nil {
		return dsn
	}
	for _, ip := range ips {
		if ip4 := ip.To4(); ip4 != nil {
			port := u.Port()
			if port != "" {
				u.Host = net.JoinHostPort(ip4.String(), port)
			} else {
				u.Host = ip4.String()
			}
			return u.String()
		}
	}
	return dsn
}

// Connect opens a PostgreSQL connection using dsn, pings the database, and returns the *gorm.DB.
// The host in dsn is resolved to IPv4 when possible to avoid IPv6 "no route to host" issues.
// Logs fatal and exits on error.
func Connect(dsn string) *gorm.DB {
	dsn = dsnForceIPv4(dsn)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("database: connect: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("database: get sql.DB: %v", err)
	}
	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("database: ping: %v", err)
	}
	return db
}

// Migrate runs GORM AutoMigrate for all models from user, cart, order, wishlist, and review packages.
func Migrate(db *gorm.DB) {
	if err := db.AutoMigrate(
		&user.User{},
		&user.RefreshToken{},
		&cart.CartItem{},
		&order.Order{},
		&order.OrderItem{},
		&wishlist.WishlistItem{},
		&review.Review{},
	); err != nil {
		log.Fatalf("database: migrate: %v", err)
	}
}
