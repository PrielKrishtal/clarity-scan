import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const usePageData = (fetchFn, deps = []) => {
    const { key } = useLocation();
    useEffect(() => {
        fetchFn();
    }, [key, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
};