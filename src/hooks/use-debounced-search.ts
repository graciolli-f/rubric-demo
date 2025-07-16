import { useState, useEffect, useCallback } from 'react';

export function useDebouncedSearch(
  initialValue: string = '',
  delay: number = 300
): [string, string, (value: string) => void] {
  const [inputValue, setInputValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [inputValue, delay]);

  const handleChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  return [inputValue, debouncedValue, handleChange];
} 