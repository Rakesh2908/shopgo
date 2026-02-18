package product

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

const defaultTimeout = 10 * time.Second

// Product represents a product from the FakeStoreAPI.
type Product struct {
	ID          int     `json:"id"`
	Title       string  `json:"title"`
	Price       float64 `json:"price"`
	Description string  `json:"description"`
	Category    string  `json:"category"`
	Image       string  `json:"image"`
	Rating      struct {
		Rate  float64 `json:"rate"`
		Count int     `json:"count"`
	} `json:"rating"`
}

// FakeStoreClient is an HTTP client for the FakeStoreAPI.
type FakeStoreClient struct {
	baseURL string
	client  *http.Client
}

// NewClient returns a new FakeStoreClient with a 10s timeout.
func NewClient(baseURL string) *FakeStoreClient {
	return &FakeStoreClient{
		baseURL: baseURL,
		client: &http.Client{
			Timeout: defaultTimeout,
		},
	}
}

// GetProducts fetches all products. Returns error on non-200.
func (c *FakeStoreClient) GetProducts(ctx context.Context) ([]Product, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/products", nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("fakestore: unexpected status %d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var products []Product
	if err := json.Unmarshal(body, &products); err != nil {
		return nil, err
	}
	return products, nil
}

// GetProduct fetches a single product by ID. Returns error on non-200.
func (c *FakeStoreClient) GetProduct(ctx context.Context, id int) (*Product, error) {
	url := c.baseURL + "/products/" + strconv.Itoa(id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("fakestore: unexpected status %d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var p Product
	if err := json.Unmarshal(body, &p); err != nil {
		return nil, err
	}
	return &p, nil
}

// GetCategories fetches all category names. Returns error on non-200.
func (c *FakeStoreClient) GetCategories(ctx context.Context) ([]string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/products/categories", nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("fakestore: unexpected status %d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var categories []string
	if err := json.Unmarshal(body, &categories); err != nil {
		return nil, err
	}
	return categories, nil
}

// GetProductsByCategory fetches products in the given category. Returns error on non-200.
func (c *FakeStoreClient) GetProductsByCategory(ctx context.Context, category string) ([]Product, error) {
	path := c.baseURL + "/products/category/" + url.PathEscape(category)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, path, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("fakestore: unexpected status %d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var products []Product
	if err := json.Unmarshal(body, &products); err != nil {
		return nil, err
	}
	return products, nil
}
