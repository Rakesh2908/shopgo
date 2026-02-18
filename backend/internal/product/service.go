package product

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/Rakesh2908/shopgo/pkg/cache"
)

const (
	cacheTTLProducts   = 5 * time.Minute
	cacheTTLCategories = 10 * time.Minute
)

// ProductService defines the interface for product operations.
type ProductService interface {
	GetAll(ctx context.Context) ([]Product, error)
	GetByID(ctx context.Context, id int) (*Product, error)
	GetCategories(ctx context.Context) ([]string, error)
	GetByCategory(ctx context.Context, category string) ([]Product, error)
	Search(ctx context.Context, q string) ([]Product, error)
}

// productService implements ProductService with an API client and in-memory cache.
type productService struct {
	client *FakeStoreClient
	cache  *cache.MemoryCache
}

// NewProductService returns a new ProductService.
func NewProductService(client *FakeStoreClient, c *cache.MemoryCache) ProductService {
	return &productService{client: client, cache: c}
}

// GetAll returns all products, using cache (key products:all, TTL 5 min) on miss.
func (s *productService) GetAll(ctx context.Context) ([]Product, error) {
	key := "products:all"
	if v, ok := s.cache.Get(key); ok {
		return v.([]Product), nil
	}
	products, err := s.client.GetProducts(ctx)
	if err != nil {
		return nil, err
	}
	s.cache.Set(key, products, cacheTTLProducts)
	return products, nil
}

// GetByID returns a product by ID, using cache (key product:{id}, TTL 5 min) on miss.
func (s *productService) GetByID(ctx context.Context, id int) (*Product, error) {
	key := fmt.Sprintf("product:%d", id)
	if v, ok := s.cache.Get(key); ok {
		return v.(*Product), nil
	}
	p, err := s.client.GetProduct(ctx, id)
	if err != nil {
		return nil, err
	}
	s.cache.Set(key, p, cacheTTLProducts)
	return p, nil
}

// GetCategories returns all category names, using cache (key categories, TTL 10 min) on miss.
func (s *productService) GetCategories(ctx context.Context) ([]string, error) {
	key := "categories"
	if v, ok := s.cache.Get(key); ok {
		return v.([]string), nil
	}
	categories, err := s.client.GetCategories(ctx)
	if err != nil {
		return nil, err
	}
	s.cache.Set(key, categories, cacheTTLCategories)
	return categories, nil
}

// GetByCategory returns products in the given category, using cache (key products:cat:{cat}, TTL 5 min) on miss.
func (s *productService) GetByCategory(ctx context.Context, category string) ([]Product, error) {
	key := "products:cat:" + category
	if v, ok := s.cache.Get(key); ok {
		return v.([]Product), nil
	}
	products, err := s.client.GetProductsByCategory(ctx, category)
	if err != nil {
		return nil, err
	}
	s.cache.Set(key, products, cacheTTLProducts)
	return products, nil
}

// Search returns products whose title contains q (case-insensitive), using cached all products.
func (s *productService) Search(ctx context.Context, q string) ([]Product, error) {
	products, err := s.GetAll(ctx)
	if err != nil {
		return nil, err
	}
	q = strings.ToLower(strings.TrimSpace(q))
	if q == "" {
		return products, nil
	}
	var out []Product
	for _, p := range products {
		if strings.Contains(strings.ToLower(p.Title), q) {
			out = append(out, p)
		}
	}
	return out, nil
}
