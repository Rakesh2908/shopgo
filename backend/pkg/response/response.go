package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Success writes a successful JSON response: { "success": true, "data": ... }.
func Success(c *gin.Context, status int, data interface{}) {
	if status == 0 {
		status = http.StatusOK
	}
	c.JSON(status, gin.H{
		"success": true,
		"data":    data,
	})
}

// SuccessWithMeta writes a successful JSON response with meta: { "success": true, "data": ..., "meta": ... }.
func SuccessWithMeta(c *gin.Context, status int, data interface{}, meta interface{}) {
	if status == 0 {
		status = http.StatusOK
	}
	c.JSON(status, gin.H{
		"success": true,
		"data":    data,
		"meta":    meta,
	})
}

// Error writes an error JSON response: { "success": false, "error": { "code": ..., "message": ... } }.
func Error(c *gin.Context, status int, code string, message string) {
	if status == 0 {
		status = http.StatusBadRequest
	}
	c.JSON(status, gin.H{
		"success": false,
		"error": gin.H{
			"code":    code,
			"message": message,
		},
	})
}
