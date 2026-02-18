package product

import (
	"net/http"
	"strconv"

	"github.com/Rakesh2908/shopgo/pkg/response"
	"github.com/gin-gonic/gin"
)

const (
	defaultPage  = 1
	defaultLimit = 12
)

// RegisterRoutes registers product routes on the given router group (all public, no auth).
// Group path should be "/products" so routes are GET /products, /products/categories, /products/search, /products/:id.
func RegisterRoutes(rg *gin.RouterGroup, svc ProductService) {
	rg.GET("/categories", handleCategories(svc))
	rg.GET("/search", handleSearch(svc))
	rg.GET("/:id", handleGetProduct(svc))
	rg.GET("", handleListProducts(svc))
}

// handleListProducts handles GET /products?page=1&limit=12&category=
func handleListProducts(svc ProductService) gin.HandlerFunc {
	return func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", strconv.Itoa(defaultPage)))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", strconv.Itoa(defaultLimit)))
		category := c.Query("category")

		if page < 1 {
			page = defaultPage
		}
		if limit < 1 || limit > 100 {
			limit = defaultLimit
		}

		var products []Product
		var err error
		if category != "" {
			products, err = svc.GetByCategory(c.Request.Context(), category)
		} else {
			products, err = svc.GetAll(c.Request.Context())
		}
		if err != nil {
			response.Error(c, http.StatusBadGateway, "UPSTREAM_ERROR", "failed to fetch products")
			return
		}

		total := len(products)
		start := (page - 1) * limit
		if start >= total {
			products = []Product{}
		} else {
			end := start + limit
			if end > total {
				end = total
			}
			products = products[start:end]
		}

		meta := gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		}
		response.SuccessWithMeta(c, http.StatusOK, products, meta)
	}
}

// handleCategories handles GET /products/categories
func handleCategories(svc ProductService) gin.HandlerFunc {
	return func(c *gin.Context) {
		categories, err := svc.GetCategories(c.Request.Context())
		if err != nil {
			response.Error(c, http.StatusBadGateway, "UPSTREAM_ERROR", "failed to fetch categories")
			return
		}
		response.Success(c, http.StatusOK, categories)
	}
}

// handleSearch handles GET /products/search?q=
func handleSearch(svc ProductService) gin.HandlerFunc {
	return func(c *gin.Context) {
		q := c.Query("q")
		products, err := svc.Search(c.Request.Context(), q)
		if err != nil {
			response.Error(c, http.StatusBadGateway, "UPSTREAM_ERROR", "failed to search products")
			return
		}
		response.Success(c, http.StatusOK, products)
	}
}

// handleGetProduct handles GET /products/:id
func handleGetProduct(svc ProductService) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		id, err := strconv.Atoi(idStr)
		if err != nil || id < 1 {
			response.Error(c, http.StatusBadRequest, "INVALID_ID", "invalid product id")
			return
		}
		p, err := svc.GetByID(c.Request.Context(), id)
		if err != nil {
			response.Error(c, http.StatusNotFound, "NOT_FOUND", "product not found")
			return
		}
		response.Success(c, http.StatusOK, p)
	}
}
