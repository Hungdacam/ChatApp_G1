import React, { createContext, useState, useContext } from "react";

const RegisterContext = createContext();

export const RegisterProvider = ({ children }) => {
  const [registerInfo, setRegisterInfo] = useState(null);

  return (
    <RegisterContext.Provider value={{ registerInfo, setRegisterInfo }}>
      {children}
    </RegisterContext.Provider>
  );
};

export const useRegister = () => useContext(RegisterContext);
