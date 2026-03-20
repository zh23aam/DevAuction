import React, { createContext, useContext, useState, useCallback } from "react";
import CustomToast from "../Components/Custom Toast/CustomToast";

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [showToast, setShowToast] = useState(false);
    const [toastDetails, setToastDetails] = useState({ msg: "", type: "" });

    const displayToast = useCallback((msg, type) => {
        setToastDetails({ msg, type });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast: displayToast }}>
            {children}
            <CustomToast
                className={showToast ? "right-10 opacity-100" : "-right-96 opacity-0"}
                msg={toastDetails.msg}
                type={toastDetails.type}
                setShowToast={setShowToast}
            />
        </ToastContext.Provider>
    );
};
