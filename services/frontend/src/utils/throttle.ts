
export function throttle<T extends (...args: any[]) => any>(
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