package cache

import (
	"sync"
	"time"
)

// item holds a cached value and its expiry time.
type item struct {
	value   interface{}
	expires at
}

// at is an absolute expiry time (nanosecond unix).
type at int64

// MemoryCache is an in-memory cache with TTL and background expiry.
type MemoryCache struct {
	store    sync.Map
	stopCh   chan struct{}
	doneCh   chan struct{}
	interval time.Duration
}

// NewMemoryCache creates a MemoryCache that runs expiry every interval (e.g. time.Minute).
// Call Stop() when shutting down to stop the background goroutine.
func NewMemoryCache(interval time.Duration) *MemoryCache {
	if interval <= 0 {
		interval = time.Minute
	}
	m := &MemoryCache{
		stopCh:  make(chan struct{}),
		doneCh:  make(chan struct{}),
		interval: interval,
	}
	go m.expireLoop()
	return m
}

// Set stores value for key with the given TTL.
func (m *MemoryCache) Set(key string, value interface{}, ttl time.Duration) {
	expires := at(time.Now().Add(ttl).UnixNano())
	m.store.Store(key, &item{value: value, expires: expires})
}

// Get returns the value for key and true if present and not expired; otherwise (nil, false).
func (m *MemoryCache) Get(key string) (interface{}, bool) {
	v, ok := m.store.Load(key)
	if !ok {
		return nil, false
	}
	it := v.(*item)
	if time.Now().UnixNano() >= int64(it.expires) {
		m.store.Delete(key)
		return nil, false
	}
	return it.value, true
}

// Delete removes the key from the cache.
func (m *MemoryCache) Delete(key string) {
	m.store.Delete(key)
}

// expireLoop runs in a goroutine and periodically deletes expired entries.
func (m *MemoryCache) expireLoop() {
	defer close(m.doneCh)
	ticker := time.NewTicker(m.interval)
	defer ticker.Stop()
	now := time.Now().UnixNano()
	for {
		select {
		case <-m.stopCh:
			return
		case <-ticker.C:
			m.store.Range(func(k, v interface{}) bool {
				it := v.(*item)
				if now >= int64(it.expires) {
					m.store.Delete(k)
				}
				return true
			})
			now = time.Now().UnixNano()
		}
	}
}

// Stop stops the background expiry goroutine. Safe to call multiple times.
func (m *MemoryCache) Stop() {
	select {
	case <-m.stopCh:
		return
	default:
		close(m.stopCh)
		<-m.doneCh
	}
}
