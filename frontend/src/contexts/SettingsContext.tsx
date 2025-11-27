import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  standardParams: string[];
  addStandardParam: (param: string) => void;
  removeStandardParam: (param: string) => void;
  updateStandardParams: (params: string[]) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_STANDARD_PARAMS = [
  'client_ip',
  'client_mac',
  'ap_mac',
  'ssid',
  'nas_id',
  'original_url',
];

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [standardParams, setStandardParams] = useState<string[]>(() => {
    const saved = localStorage.getItem('standardParams');
    return saved ? JSON.parse(saved) : DEFAULT_STANDARD_PARAMS;
  });

  useEffect(() => {
    localStorage.setItem('standardParams', JSON.stringify(standardParams));
  }, [standardParams]);

  const addStandardParam = (param: string) => {
    if (!standardParams.includes(param)) {
      setStandardParams([...standardParams, param]);
    }
  };

  const removeStandardParam = (param: string) => {
    setStandardParams(standardParams.filter(p => p !== param));
  };

  const updateStandardParams = (params: string[]) => {
    setStandardParams(params);
  };

  return (
    <SettingsContext.Provider value={{ standardParams, addStandardParam, removeStandardParam, updateStandardParams }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
