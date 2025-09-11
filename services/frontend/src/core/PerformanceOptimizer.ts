/**
 * Performance Optimization Utilities
 * 
 * A comprehensive singleton class providing performance optimization features including:
 * - Batched updates using requestAnimationFrame
 * - Memoization with LRU cache
 * - Debouncing and throttling
 * - Memory management
 * - Performance monitoring
 * 
 * @example
 * ```typescript
 * // Get the singleton instance
 * const optimizer = PerformanceOptimizer.getInstance();
 * 
 * // Schedule batched updates
 * PerformanceOptimizer.scheduleUpdate(() => {
 *   updateUI();
 * });
 * 
 * // Use memoization for expensive functions
 * const memoizedCalculation = PerformanceOptimizer.memoize(expensiveFunction);
 * 
 * // Monitor performance
 * const stopMonitoring = PerformanceOptimizer.startMonitoring();
 * ```
 */

/**
 * Performance metrics interface for tracking optimization statistics
 */
interface PerformanceMetrics {
  /** Total number of updates processed */
  updateCount: number;
  /** Number of batched update cycles */
  batchCount: number;
  /** Number of successful cache hits */
  cacheHits: number;
  /** Number of cache misses */
  cacheMisses: number;
  /** Average time per update batch in milliseconds */
  averageUpdateTime: number;
  /** Most recent update batch time in milliseconds */
  lastUpdateTime: number;
}

/**
 * Cache entry structure for memoization
 * @template T - Type of the cached value
 */
interface MemoCache<T = any> {
  /** The cached value */
  value: T;
  /** Timestamp when the value was cached */
  timestamp: number;
  /** Number of times this cache entry has been accessed */
  accessCount: number;
}


export class PerformanceOptimizer {
  /** Prevent instantiation from other classes */
  private constructor() { }

  private static instance: PerformanceOptimizer;
  private static rafId: number | null = null;
  private static updateQueue: Set<() => void> = new Set();
  private static priorityQueue: Set<() => void> = new Set();
  
  // Namespaced memoization cache with LRU eviction
  private static memoCache = new Map<string, MemoCache>();
  private static functionCounter = 0;
  private static readonly MAX_CACHE_SIZE = 1000;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Performance metrics
  private static metrics: PerformanceMetrics = {
    updateCount: 0,
    batchCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageUpdateTime: 0,
    lastUpdateTime: 0
  };

  private static updateTimes: number[] = [];
  private static readonly MAX_UPDATE_HISTORY = 100;

  /**
   * Get singleton instance of PerformanceOptimizer
   * 
   * @returns The singleton instance
   * 
   * @example
   * ```typescript
   * const optimizer = PerformanceOptimizer.getInstance();
   * ```
   */
  static getInstance(): PerformanceOptimizer {
    if (!this.instance) {
      this.instance = new PerformanceOptimizer();
    }
    return this.instance;
  }

  /**
   * Schedule update with batching using requestAnimationFrame
   * 
   * Batches multiple DOM updates together to improve performance by reducing layout thrashing.
   * Updates are executed on the next animation frame, with high priority updates processed first.
   * 
   * @param updateFn - Function to execute in the next animation frame
   * @param priority - Priority level of the update ('normal' | 'high')
   * 
   * @example
   * ```typescript
   * // Schedule a normal priority update
   * PerformanceOptimizer.scheduleUpdate(() => {
   *   element.style.transform = `translateX(${x}px)`;
   * });
   * 
   * // Schedule a high priority update (processed first)
   * PerformanceOptimizer.scheduleUpdate(() => {
   *   criticalElement.style.display = 'block';
   * }, 'high');
   * 
   * // Batch multiple updates efficiently
   * for (let i = 0; i < 100; i++) {
   *   PerformanceOptimizer.scheduleUpdate(() => {
   *     elements[i].style.opacity = '1';
   *   });
   * }
   * ```
   */
  static scheduleUpdate(updateFn: () => void, priority: 'normal' | 'high' = 'normal'): void {
    const queue = priority === 'high' ? this.priorityQueue : this.updateQueue;
    queue.add(updateFn);
    
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.flushUpdates();
      });
    }
  }

  /**
   * Flush all queued updates
   * 
   * @private
   * Internal method that processes all queued updates in priority order
   */
  private static flushUpdates(): void {
    const startTime = performance.now();
    
    try {
      const highPriorityUpdates = Array.from(this.priorityQueue);
      const normalUpdates = Array.from(this.updateQueue);
      
      this.priorityQueue.clear();
      this.updateQueue.clear();
      this.rafId = null;

      // Execute updates
      [...highPriorityUpdates, ...normalUpdates].forEach(fn => {
        try {
          fn();
        } catch (error) {
          console.error('Update error:', error);
        }
      });

      // Update metrics
      this.metrics.batchCount++;
      this.metrics.updateCount += highPriorityUpdates.length + normalUpdates.length;
      
    } finally {
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      this.updateTimes.push(updateTime);
      if (this.updateTimes.length > this.MAX_UPDATE_HISTORY) {
        this.updateTimes.shift();
      }
      
      this.metrics.lastUpdateTime = updateTime;
      this.metrics.averageUpdateTime = this.updateTimes.reduce((sum, time) => sum + time, 0) / this.updateTimes.length;
    }
  }

  /**
   * Cancel all scheduled updates
   * 
   * Clears all pending updates from both normal and high priority queues,
   * and cancels the scheduled animation frame.
   * 
   * @example
   * ```typescript
   * // Schedule some updates
   * PerformanceOptimizer.scheduleUpdate(() => updateUI());
   * PerformanceOptimizer.scheduleUpdate(() => updateChart());
   * 
   * // Cancel all pending updates (useful during component unmounting)
   * PerformanceOptimizer.cancelUpdates();
   * ```
   */
  static cancelUpdates(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.updateQueue.clear();
    this.priorityQueue.clear();
  }

  /**
   * Memoize function with namespaced caching to prevent collisions
   * 
   * @param fn - Function to memoize
   * @param options - Memoization options
   * @param options.namespace - Custom namespace to prevent cache collisions
   * @param options.keyFn - Custom function to generate cache keys
   * @param options.ttl - Time-to-live for cache entries in milliseconds
   * @param options.maxSize - Maximum number of cache entries for this function
   * 
   * @example
   * ```typescript
   * // Each function gets its own namespace automatically
   * const memoizedAdd = PerformanceOptimizer.memoize((a, b) => a + b);
   * const memoizedMult = PerformanceOptimizer.memoize((a, b) => a * b);
   * 
   * // Custom namespace for related functions
   * const memoizedUserFetch = PerformanceOptimizer.memoize(
   *   (id) => fetchUser(id),
   *   { namespace: 'user-api' }
   * );
   * 
   * const memoizedUserValidate = PerformanceOptimizer.memoize(
   *   (userData) => validateUser(userData),
   *   { namespace: 'user-api' } // Same namespace for related operations
   * );
   * 
   * // Custom key generation and TTL
   * const memoizedComplexCalc = PerformanceOptimizer.memoize(
   *   (obj) => expensiveCalculation(obj),
   *   {
   *     namespace: 'calculations',
   *     keyFn: (obj) => `${obj.id}-${obj.version}`, // Custom key
   *     ttl: 10 * 60 * 1000, // 10 minutes
   *     maxSize: 50 // Limit this function to 50 cached results
   *   }
   * );
   * ```
   */
  static memoize<T extends (...args: any[]) => any>(
    fn: T, 
    options: {
      namespace?: string;
      keyFn?: (...args: any[]) => string;
      ttl?: number;
      maxSize?: number;
    } = {}
  ): T {
    // Generate unique namespace for this function
    const functionId = options.namespace || `fn_${++this.functionCounter}`;
    
    const { 
      keyFn = (...args) => JSON.stringify(args),
      ttl = this.CACHE_TTL,
      maxSize = this.MAX_CACHE_SIZE
    } = options;

    return ((...args: any[]) => {
      // Create namespaced key to prevent collisions
      const baseKey = keyFn(...args);
      const namespacedKey = `${functionId}:${baseKey}`;
      
      const now = Date.now();
      const cached = this.memoCache.get(namespacedKey);
      
      // Check cache hit
      if (cached && (now - cached.timestamp) < ttl) {
        cached.accessCount++;
        this.metrics.cacheHits++;
        return cached.value;
      }
      
      // Cache miss - compute value
      this.metrics.cacheMisses++;
      const result = fn(...args);
      
      // Store in cache with namespace
      this.memoCache.set(namespacedKey, {
        value: result,
        timestamp: now,
        accessCount: 1
      });
      
      // Cleanup if needed (check against individual function's maxSize)
      this.cleanupNamespaceCache(functionId, maxSize);
      
      return result;
    }) as T;
  }

  /**
   * Cleanup cache entries for a specific namespace
   * 
   * @private
   * @param namespace - The namespace to cleanup
   * @param maxSize - Maximum size for this namespace
   */
  private static cleanupNamespaceCache(namespace: string, maxSize: number): void {
    // Get all entries for this namespace
    const namespaceEntries = Array.from(this.memoCache.entries())
      .filter(([key]) => key.startsWith(`${namespace}:`));
    
    if (namespaceEntries.length <= maxSize) {
      return; // No cleanup needed
    }

    const now = Date.now();
    
    // Remove expired entries first
    namespaceEntries.forEach(([key, cache]) => {
      if (now - cache.timestamp > this.CACHE_TTL) {
        this.memoCache.delete(key);
      }
    });

    // Get updated entries after expiration cleanup
    const remainingEntries = Array.from(this.memoCache.entries())
      .filter(([key]) => key.startsWith(`${namespace}:`));

    // If still over limit, remove least accessed entries
    if (remainingEntries.length > maxSize) {
      const sortedEntries = remainingEntries
        .sort(([, a], [, b]) => a.accessCount - b.accessCount);
      
      const toRemove = sortedEntries.slice(0, Math.floor(maxSize * 0.2));
      toRemove.forEach(([key]) => this.memoCache.delete(key));
    }
  }

  /**
   * Cleanup cache using LRU strategy (updated for namespaced keys)
   * 
   * @private
   * Removes expired entries and least recently used entries when cache is full
   */
  private static cleanupCache(): void {
    const now = Date.now();
    const entries = Array.from(this.memoCache.entries());
    
    // Remove expired entries first
    entries.forEach(([key, cache]) => {
      if (now - cache.timestamp > this.CACHE_TTL) {
        this.memoCache.delete(key);
      }
    });
    
    // If still over limit, remove least accessed entries
    if (this.memoCache.size >= this.MAX_CACHE_SIZE) {
      const sortedEntries = entries
        .filter(([key]) => this.memoCache.has(key))
        .sort(([, a], [, b]) => a.accessCount - b.accessCount);
      
      const toRemove = sortedEntries.slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.2));
      toRemove.forEach(([key]) => this.memoCache.delete(key));
    }
  }

  /**
   * Clear memoization cache for specific namespace or all
   * 
   * @param namespace - Optional namespace to clear. If omitted, clears all cache
   * 
   * @example
   * ```typescript
   * // Clear cache for specific namespace
   * PerformanceOptimizer.clearMemoCache('user-api');
   * 
   * // Clear all cache
   * PerformanceOptimizer.clearMemoCache();
   * 
   * // Or clear cache periodically
   * setInterval(() => {
   *   PerformanceOptimizer.clearMemoCache();
   * }, 3600000); // Clear every hour
   * ```
   */
  static clearMemoCache(namespace?: string): void {
    if (namespace) {
      // Clear only entries for specific namespace
      const keysToDelete = Array.from(this.memoCache.keys())
        .filter(key => key.startsWith(`${namespace}:`));
      
      keysToDelete.forEach(key => this.memoCache.delete(key));
    } else {
      // Clear all cache
      this.memoCache.clear();
      this.metrics.cacheHits = 0;
      this.metrics.cacheMisses = 0;
    }
  }

  /**
   * Get cache statistics by namespace
   * 
   * @param namespace - Optional namespace to get stats for
   * @returns Cache statistics
   * 
   * @example
   * ```typescript
   * // Get stats for specific namespace
   * const userApiStats = PerformanceOptimizer.getCacheStats('user-api');
   * console.log(`User API cache has ${userApiStats.size} entries`);
   * 
   * // Get overall stats
   * const allStats = PerformanceOptimizer.getCacheStats();
   * ```
   */
  static getCacheStats(namespace?: string): {
    size: number;
    entries: Array<{
      key: string;
      accessCount: number;
      age: number;
    }>;
  } {
    const entries = Array.from(this.memoCache.entries());
    const filteredEntries = namespace 
      ? entries.filter(([key]) => key.startsWith(`${namespace}:`))
      : entries;

    const now = Date.now();
    
    return {
      size: filteredEntries.length,
      entries: filteredEntries.map(([key, cache]) => ({
        key: namespace ? key.substring(namespace.length + 1) : key, // Remove namespace prefix
        accessCount: cache.accessCount,
        age: now - cache.timestamp
      }))
    };
  }

  /**
   * Debounce function calls
   * 
   * Creates a debounced version of the provided function that delays execution
   * until after the specified delay has elapsed since the last invocation.
   * 
   * @template T - Function type to debounce
   * @param fn - Function to debounce
   * @param delay - Delay in milliseconds
   * @returns Debounced version of the function
   * 
   * @example
   * ```typescript
   * // Debounce search input
   * const searchUsers = (query: string) => {
   *   console.log('Searching for:', query);
   *   // API call here
   * };
   * 
   * const debouncedSearch = PerformanceOptimizer.debounce(searchUsers, 300);
   * 
   * // Only the last call will execute after 300ms
   * debouncedSearch('a');
   * debouncedSearch('ab');
   * debouncedSearch('abc'); // Only this will execute
   * 
   * // Debounce form validation
   * const validateForm = () => {
   *   // Validation logic
   * };
   * 
   * const debouncedValidate = PerformanceOptimizer.debounce(validateForm, 500);
   * inputElement.addEventListener('input', debouncedValidate);
   * ```
   */
  static debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): T {
    let timeoutId: number;
    
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fn(...args), delay);
    }) as T;
  }

  /**
   * Throttle function calls
   * 
   * Creates a throttled version of the provided function that limits execution
   * to at most once per specified time limit.
   * 
   * @template T - Function type to throttle
   * @param fn - Function to throttle
   * @param limit - Time limit in milliseconds
   * @returns Throttled version of the function
   * 
   * @example
   * ```typescript
   * // Throttle scroll handler
   * const handleScroll = () => {
   *   console.log('Scroll position:', window.scrollY);
   *   // Update scroll-based animations
   * };
   * 
   * const throttledScroll = PerformanceOptimizer.throttle(handleScroll, 16); // ~60fps
   * window.addEventListener('scroll', throttledScroll);
   * 
   * // Throttle resize handler
   * const handleResize = () => {
   *   updateLayout();
   * };
   * 
   * const throttledResize = PerformanceOptimizer.throttle(handleResize, 100);
   * window.addEventListener('resize', throttledResize);
   * 
   * // Throttle button clicks to prevent spam
   * const handleSubmit = () => {
   *   submitForm();
   * };
   * 
   * const throttledSubmit = PerformanceOptimizer.throttle(handleSubmit, 1000);
   * ```
   */
  static throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
  ): T {
    let inThrottle: boolean;
    
    return ((...args: any[]) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }

  /**
   * Create a batched version of a function
   * 
   * Groups multiple function calls into batches for more efficient processing.
   * Useful for operations that benefit from bulk processing like DOM updates or API calls.
   * 
   * @template T - Type of items to batch
   * @param fn - Function that processes batches
   * @param batchSize - Maximum number of items per batch
   * @param delay - Maximum delay before processing partial batch
   * @returns Function that accepts individual items for batching
   * 
   * @example
   * ```typescript
   * // Batch DOM updates
   * const updateElements = (elements: HTMLElement[]) => {
   *   elements.forEach(el => {
   *     el.style.opacity = '1';
   *     el.classList.add('visible');
   *   });
   * };
   * 
   * const batchedUpdate = PerformanceOptimizer.batch(updateElements, 10, 16);
   * 
   * // Add elements individually - they'll be batched automatically
   * elements.forEach(el => batchedUpdate(el));
   * 
   * // Batch API requests
   * const bulkUpdateUsers = async (users: User[]) => {
   *   await fetch('/api/users/bulk-update', {
   *     method: 'POST',
   *     body: JSON.stringify(users)
   *   });
   * };
   * 
   * const batchedUserUpdate = PerformanceOptimizer.batch(bulkUpdateUsers, 5, 1000);
   * 
   * // Updates will be batched into groups of 5
   * modifiedUsers.forEach(user => batchedUserUpdate(user));
   * ```
   */
  static batch<T>(
    fn: (items: T[]) => void,
    batchSize: number = 10,
    delay: number = 16
  ): (item: T) => void {
    let batch: T[] = [];
    let timeoutId: number;

    return (item: T) => {
      batch.push(item);
      
      if (batch.length >= batchSize) {
        fn([...batch]);
        batch = [];
        clearTimeout(timeoutId);
      } else {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          if (batch.length > 0) {
            fn([...batch]);
            batch = [];
          }
        }, delay);
      }
    };
  }

  /**
   * Get performance metrics with cache breakdown by namespace
   * 
   * Returns comprehensive performance statistics including cache performance,
   * update metrics, and memory usage information.
   * 
   * @returns Performance metrics object with additional runtime information
   * 
   * @example
   * ```typescript
   * const metrics = PerformanceOptimizer.getMetrics();
   * console.log('Cache hit rate:', 
   *   (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100
   * );
   * 
   * // Display metrics in UI
   * const displayMetrics = () => {
   *   const metrics = PerformanceOptimizer.getMetrics();
   *   return (
   *     <div>
   *       <p>Updates: {metrics.updateCount}</p>
   *       <p>Avg Update Time: {metrics.averageUpdateTime.toFixed(2)}ms</p>
   *       <p>Cache Size: {metrics.cacheSize}</p>
   *       {metrics.memoryUsage && (
   *         <p>Memory: {metrics.memoryUsage.percentage.toFixed(1)}%</p>
   *       )}
   *     </div>
   *   );
   * };
   * ```
   */
  static getMetrics(): PerformanceMetrics & {
    cacheSize: number;
    queueSize: number;
    namespaceBreakdown: Record<string, number>;
    memoryUsage?: {
      used: number;
      total: number;
      percentage: number;
    };
  } {
    const result = {
      ...this.metrics,
      cacheSize: this.memoCache.size,
      queueSize: this.updateQueue.size + this.priorityQueue.size,
      namespaceBreakdown: this.getNamespaceBreakdown()
    };

    // Add memory info if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      (result as any).memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }

    return result;
  }

  /**
   * Get breakdown of cache entries by namespace
   * 
   * @private
   */
  private static getNamespaceBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const [key] of this.memoCache) {
      const colonIndex = key.indexOf(':');
      if (colonIndex !== -1) {
        const namespace = key.substring(0, colonIndex);
        breakdown[namespace] = (breakdown[namespace] || 0) + 1;
      }
    }
    
    return breakdown;
  }

  /**
   * Reset performance metrics
   * 
   * Resets all performance counters and metrics to their initial state.
   * Useful for benchmarking specific operations or clearing historical data.
   * 
   * @example
   * ```typescript
   * // Reset metrics before benchmarking
   * PerformanceOptimizer.resetMetrics();
   * 
   * // Run your operations
   * performOperations();
   * 
   * // Check metrics
   * const metrics = PerformanceOptimizer.getMetrics();
   * console.log('Operation metrics:', metrics);
   * ```
   */
  static resetMetrics(): void {
    this.metrics = {
      updateCount: 0,
      batchCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageUpdateTime: 0,
      lastUpdateTime: 0
    };
    this.updateTimes = [];
  }

  /**
   * Trigger memory cleanup
   * 
   * Performs various cleanup operations to free memory including cache cleanup,
   * queue clearing, and garbage collection suggestion.
   * 
   * @example
   * ```typescript
   * // Manually trigger cleanup
   * PerformanceOptimizer.triggerCleanup();
   * 
   * // Trigger cleanup when component unmounts
   * useEffect(() => {
   *   return () => {
   *     PerformanceOptimizer.triggerCleanup();
   *   };
   * }, []);
   * ```
   */
  static triggerCleanup(): void {
    this.cleanupCache();
    
    if (this.updateQueue.size > 100) {
      console.warn('Large update queue detected, clearing...');
      this.updateQueue.clear();
    }
    
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc();
    }
  }

  /**
   * Start performance monitoring
   * 
   * Begins periodic monitoring of memory usage and performance metrics.
   * In development mode, logs metrics to console at specified intervals.
   * 
   * @param interval - Monitoring interval in milliseconds
   * @returns Cleanup function to stop monitoring
   * 
   * @example
   * ```typescript
   * // Start monitoring with default 30 second interval
   * const stopMonitoring = PerformanceOptimizer.startMonitoring();
   * 
   * // Start monitoring with custom interval
   * const stopCustomMonitoring = PerformanceOptimizer.startMonitoring(10000); // 10 seconds
   * 
   * // Stop monitoring when component unmounts
   * useEffect(() => {
   *   const cleanup = PerformanceOptimizer.startMonitoring();
   *   return cleanup;
   * }, []);
   * 
   * // Stop monitoring manually
   * const cleanup = PerformanceOptimizer.startMonitoring();
   * setTimeout(() => {
   *   cleanup(); // Stop after 5 minutes
   * }, 300000);
   * ```
   */
  static startMonitoring(interval: number = 30000): () => void {
    const monitorInterval = setInterval(() => {
      // Monitor memory and trigger cleanup if needed
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usedPercent > 80) {
          console.warn('High memory usage detected, triggering cleanup');
          this.triggerCleanup();
        }
      }
      
      // Log metrics in development
      // if (import.meta.env?.MODE === 'development') {
      //   console.group('Performance Metrics');
      //   console.table(this.getMetrics());
      //   console.groupEnd();
      // }
    }, interval);

    return () => {
      clearInterval(monitorInterval);
    };
  }

  /**
   * Optimize image loading with lazy loading and preloading
   * 
   * Automatically sets up lazy loading for images with data-src attributes
   * and preloads critical images marked with data-preload attributes.
   * 
   * @example
   * ```html
   * <!-- Lazy loaded image -->
   * <img data-src="/path/to/image.jpg" alt="Lazy loaded" />
   * 
   * <!-- Critical image to preload -->
   * <img src="/path/to/critical.jpg" data-preload alt="Critical" />
   * ```
   * 
   * ```typescript
   * // Call once when page loads
   * PerformanceOptimizer.optimizeImageLoading();
   * 
   * // Or call after dynamically adding images
   * addNewImages();
   * PerformanceOptimizer.optimizeImageLoading();
   * ```
   */
  static optimizeImageLoading(): void {
    // Lazy loading for images with data-src
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => imageObserver.observe(img));

    // Preload critical images
    const criticalImages = document.querySelectorAll('img[data-preload]');
    criticalImages.forEach(img => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = (img as HTMLImageElement).src;
      document.head.appendChild(link);
    });
  }

  /**
   * Monitor memory usage and trigger cleanup
   * 
   * @private
   * Checks current memory usage and triggers cleanup when threshold is exceeded
   */
  static monitorMemory(): void {
    if ('memory' in performance) {
      console.log("i am in monitoryMemory");
      // const memory: any = performance.memory;
      const memory = (performance as any).memory;
      const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      if (usedPercent > 80) {
        console.warn('High memory usage detected, triggering cleanup');
        this.triggerCleanup();
      }
    }
  }


  /**
   * Create performance-optimized component wrapper
   * 
   * Applies various performance optimizations to a component or function
   * including memoization, debouncing, and throttling.
   * 
   * @template T - Function type to optimize
   * @param component - Component or function to optimize
   * @param options - Optimization options
   * @param options.memoize - Enable memoization
   * @param options.debounce - Debounce delay in milliseconds
   * @param options.throttle - Throttle limit in milliseconds
   * @returns Optimized version of the component
   * 
   * @example
   * ```typescript
   * // Optimize a React component
   * const ExpensiveComponent = ({ data }: { data: any[] }) => {
   *   return (
   *     <div>
   *       {data.map(item => (
   *         <ComplexItem key={item.id} item={item} />
   *       ))}
   *     </div>
   *   );
   * };
   * 
   * const OptimizedComponent = PerformanceOptimizer.optimizeComponent(
   *   ExpensiveComponent,
   *   { memoize: true }
   * );
   * 
   * // Optimize an event handler
   * const handleSearch = (query: string) => {
   *   searchAPI(query);
   * };
   * 
   * const optimizedSearch = PerformanceOptimizer.optimizeComponent(
   *   handleSearch,
   *   { 
   *     memoize: true,
   *     debounce: 300 
   *   }
   * );
   * 
   * // Optimize scroll handler
   * const handleScroll = () => {
   *   updateScrollPosition();
   * };
   * 
   * const optimizedScroll = PerformanceOptimizer.optimizeComponent(
   *   handleScroll,
   *   { throttle: 16 } // ~60fps
   * );
   * ```
   */
  static optimizeComponent<T extends (...args: any[]) => any>(
    component: T,
    options: {
      memoize?: boolean;
      debounce?: number;
      throttle?: number;
    } = {}
  ): T {
    let optimizedComponent = component;

    if (options.memoize) {
      optimizedComponent = this.memoize(optimizedComponent);
    }

    if (options.debounce) {
      optimizedComponent = this.debounce(optimizedComponent, options.debounce);
    }

    if (options.throttle) {
      optimizedComponent = this.throttle(optimizedComponent, options.throttle);
    }

    return optimizedComponent;
  }
}

export default PerformanceOptimizer;
