package config

import (
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

// Duration wraps time.Duration for envconfig decoding (e.g. "15m", "168h").
type Duration time.Duration

// Decode implements envconfig.Decoder for duration strings.
func (d *Duration) Decode(value string) error {
	v, err := time.ParseDuration(value)
	if err != nil {
		return err
	}
	*d = Duration(v)
	return nil
}

// Config holds application configuration loaded from environment variables.
type Config struct {
	Port                string   `envconfig:"PORT"`
	Environment         string   `envconfig:"ENVIRONMENT"`
	DatabaseURL         string   `envconfig:"DATABASE_URL"`
	DatabasePoolerURL   string   `envconfig:"DATABASE_POOLER_URL"` // optional; use if direct DB fails with "no route to host" (e.g. Supabase Session pooler)
	JWTSecret           string   `envconfig:"JWT_SECRET"`
	JWTAccessTTL        Duration `envconfig:"JWT_ACCESS_TTL"`
	JWTRefreshTTL        Duration `envconfig:"JWT_REFRESH_TTL"`
	StripeSecretKey     string   `envconfig:"STRIPE_SECRET_KEY"`
	StripeWebhookSecret string   `envconfig:"STRIPE_WEBHOOK_SECRET"`
	FakestoreBaseURL    string   `envconfig:"FAKESTORE_BASE_URL"`
	CORSAllowedOrigins  string   `envconfig:"CORS_ALLOWED_ORIGINS"`
}

// Load reads configuration from environment variables and returns Config.
// If a .env file exists in the current directory or in the executable's directory, it is loaded first.
// Env var names match the .env file keys (e.g. PORT, DATABASE_URL, JWT_SECRET).
// Logs fatal and exits on error.
func Load() *Config {
	// Try loading .env from current working directory, then from executable dir
	for _, path := range []string{".env", tryExecDirEnv()} {
		if path == "" {
			continue
		}
		if err := godotenv.Load(path); err == nil {
			break
		}
	}

	var c Config
	if err := envconfig.Process("", &c); err != nil {
		log.Fatalf("config: load env: %v", err)
	}
	return &c
}

// tryExecDirEnv returns executable_dir/.env if the executable path is known, else "".
func tryExecDirEnv() string {
	exe, err := os.Executable()
	if err != nil {
		return ""
	}
	return filepath.Join(filepath.Dir(exe), ".env")
}
