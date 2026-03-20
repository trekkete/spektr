import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  standardParams: string[];
  addStandardParam: (param: string) => void;
  removeStandardParam: (param: string) => void;
  updateStandardParams: (params: string[]) => void;
  welcomePagePaths: string[];
  addWelcomePagePath: (path: string) => void;
  removeWelcomePagePath: (path: string) => void;
  updateWelcomePagePaths: (paths: string[]) => void;
  loginParamValues: string[];
  addLoginParamValue: (value: string) => void;
  removeLoginParamValue: (value: string) => void;
  updateLoginParamValues: (values: string[]) => void;
  logoutParamValues: string[];
  addLogoutParamValue: (value: string) => void;
  removeLogoutParamValue: (value: string) => void;
  updateLogoutParamValues: (values: string[]) => void;
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

const DEFAULT_WELCOME_PAGE_PATHS = [
  '/start',
  '/redirect',
  '/welcome',
  '/portal',
  '/splash',
  '/captive',
];

const DEFAULT_LOGIN_PARAM_VALUES = [
  'login',
  'auth',
  'authenticate',
  'signin',
];

const DEFAULT_LOGOUT_PARAM_VALUES = [
  'logout',
  'logoff',
  'disconnect',
  'signout',
];

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [standardParams, setStandardParams] = useState<string[]>(() => {
    const saved = localStorage.getItem('standardParams');
    return saved ? JSON.parse(saved) : DEFAULT_STANDARD_PARAMS;
  });

  const [welcomePagePaths, setWelcomePagePaths] = useState<string[]>(() => {
    const saved = localStorage.getItem('welcomePagePaths');
    return saved ? JSON.parse(saved) : DEFAULT_WELCOME_PAGE_PATHS;
  });

  const [loginParamValues, setLoginParamValues] = useState<string[]>(() => {
    const saved = localStorage.getItem('loginParamValues');
    return saved ? JSON.parse(saved) : DEFAULT_LOGIN_PARAM_VALUES;
  });

  const [logoutParamValues, setLogoutParamValues] = useState<string[]>(() => {
    const saved = localStorage.getItem('logoutParamValues');
    return saved ? JSON.parse(saved) : DEFAULT_LOGOUT_PARAM_VALUES;
  });

  useEffect(() => {
    localStorage.setItem('standardParams', JSON.stringify(standardParams));
  }, [standardParams]);

  useEffect(() => {
    localStorage.setItem('welcomePagePaths', JSON.stringify(welcomePagePaths));
  }, [welcomePagePaths]);

  useEffect(() => {
    localStorage.setItem('loginParamValues', JSON.stringify(loginParamValues));
  }, [loginParamValues]);

  useEffect(() => {
    localStorage.setItem('logoutParamValues', JSON.stringify(logoutParamValues));
  }, [logoutParamValues]);

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

  const addWelcomePagePath = (path: string) => {
    if (!welcomePagePaths.includes(path)) {
      setWelcomePagePaths([...welcomePagePaths, path]);
    }
  };

  const removeWelcomePagePath = (path: string) => {
    setWelcomePagePaths(welcomePagePaths.filter(p => p !== path));
  };

  const updateWelcomePagePaths = (paths: string[]) => {
    setWelcomePagePaths(paths);
  };

  const addLoginParamValue = (value: string) => {
    if (!loginParamValues.includes(value)) {
      setLoginParamValues([...loginParamValues, value]);
    }
  };

  const removeLoginParamValue = (value: string) => {
    setLoginParamValues(loginParamValues.filter(v => v !== value));
  };

  const updateLoginParamValues = (values: string[]) => {
    setLoginParamValues(values);
  };

  const addLogoutParamValue = (value: string) => {
    if (!logoutParamValues.includes(value)) {
      setLogoutParamValues([...logoutParamValues, value]);
    }
  };

  const removeLogoutParamValue = (value: string) => {
    setLogoutParamValues(logoutParamValues.filter(v => v !== value));
  };

  const updateLogoutParamValues = (values: string[]) => {
    setLogoutParamValues(values);
  };

  return (
    <SettingsContext.Provider value={{
      standardParams,
      addStandardParam,
      removeStandardParam,
      updateStandardParams,
      welcomePagePaths,
      addWelcomePagePath,
      removeWelcomePagePath,
      updateWelcomePagePaths,
      loginParamValues,
      addLoginParamValue,
      removeLoginParamValue,
      updateLoginParamValues,
      logoutParamValues,
      addLogoutParamValue,
      removeLogoutParamValue,
      updateLogoutParamValues,
    }}>
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
