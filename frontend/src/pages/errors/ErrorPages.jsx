import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4">
      <h1 className="text-5xl font-black text-slate-800">404</h1>
      <h3 className="text-lg font-bold text-slate-700">Page Not Found</h3>
      <p className="text-xs text-slate-400 max-w-xs">
        The page you are looking for might have been removed or is temporarily unavailable.
      </p>
      <Button 
        onClick={() => navigate('/')} 
        variant="primary" 
        className="mt-2 text-xs font-bold"
      >
        Go to Dashboard
      </Button>
    </div>
  );
};
