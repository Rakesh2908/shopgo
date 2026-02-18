package review

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/Rakesh2908/shopgo/internal/auth"
	"github.com/Rakesh2908/shopgo/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	defaultPage  = 1
	defaultLimit = 10
)

// CreateReviewRequest is the request body for POST /products/:id/reviews.
type CreateReviewRequest struct {
	Rating  int    `json:"rating" binding:"required,min=1,max=5"`
	Comment string `json:"comment" binding:"max=500"`
}

// RegisterRoutes registers review routes: GET/POST on products group (/:id/reviews), DELETE on api (/reviews/:id).
func RegisterRoutes(api *gin.RouterGroup, productsGroup *gin.RouterGroup, svc Service, authMiddleware gin.HandlerFunc) {
	productsGroup.GET("/:id/reviews", handleGetProductReviews(svc))
	productsGroup.POST("/:id/reviews", authMiddleware, handleCreateReview(svc))
	api.DELETE("/reviews/:id", authMiddleware, handleDeleteReview(svc))
}

// handleGetProductReviews handles GET /products/:id/reviews?page=&limit= (public). Returns reviews + avgRating + totalCount.
func handleGetProductReviews(svc Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		productID, err := strconv.Atoi(idStr)
		if err != nil || productID < 1 {
			response.Error(c, http.StatusBadRequest, "INVALID_ID", "invalid product id")
			return
		}
		page, _ := strconv.Atoi(c.DefaultQuery("page", strconv.Itoa(defaultPage)))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", strconv.Itoa(defaultLimit)))
		if page < 1 {
			page = defaultPage
		}
		if limit < 1 || limit > 100 {
			limit = defaultLimit
		}
		result, err := svc.GetByProductID(c.Request.Context(), productID, page, limit)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to get reviews")
			return
		}
		response.Success(c, http.StatusOK, result)
	}
}

// handleCreateReview handles POST /products/:id/reviews (protected). Body: { rating 1-5, comment max 500 }.
func handleCreateReview(svc Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := auth.GetUserIDFromContext(c)
		if userID == uuid.Nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing user context")
			return
		}
		idStr := c.Param("id")
		productID, err := strconv.Atoi(idStr)
		if err != nil || productID < 1 {
			response.Error(c, http.StatusBadRequest, "INVALID_ID", "invalid product id")
			return
		}
		var req CreateReviewRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", validationMessage(err))
			return
		}
		rev, err := svc.Create(c.Request.Context(), userID, productID, CreateReviewInput{
			Rating:  req.Rating,
			Comment: req.Comment,
		})
		if err != nil {
			if strings.Contains(err.Error(), "product not found") {
				response.Error(c, http.StatusNotFound, "PRODUCT_NOT_FOUND", "product not found")
				return
			}
			if strings.Contains(err.Error(), "rating must be") {
				response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "rating must be between 1 and 5")
				return
			}
			if strings.Contains(err.Error(), "comment must be") {
				response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "comment must be at most 500 characters")
				return
			}
			if isDuplicateKeyError(err) {
				response.Error(c, http.StatusConflict, "ALREADY_REVIEWED", "you have already reviewed this product")
				return
			}
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to create review")
			return
		}
		response.Success(c, http.StatusCreated, rev)
	}
}

// handleDeleteReview handles DELETE /reviews/:id (protected). User can delete only their own review.
func handleDeleteReview(svc Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := auth.GetUserIDFromContext(c)
		if userID == uuid.Nil {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing user context")
			return
		}
		idStr := c.Param("id")
		reviewID, err := uuid.Parse(idStr)
		if err != nil {
			response.Error(c, http.StatusBadRequest, "INVALID_ID", "invalid review id")
			return
		}
		if err := svc.Delete(c.Request.Context(), reviewID, userID); err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				response.Error(c, http.StatusNotFound, "NOT_FOUND", "review not found or you are not the owner")
				return
			}
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to delete review")
			return
		}
		response.Success(c, http.StatusOK, gin.H{"deleted": true})
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

// isDuplicateKeyError returns true if err is a PostgreSQL unique violation.
func isDuplicateKeyError(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	return strings.Contains(s, "unique constraint") || strings.Contains(s, "duplicate key") || strings.Contains(s, "23505")
}
