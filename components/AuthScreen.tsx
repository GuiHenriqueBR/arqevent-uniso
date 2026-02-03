import React, { useState } from "react";
import LoginForm from "./auth/LoginForm";
import RegisterForm from "./auth/RegisterForm";
import ForgotForm from "./auth/ForgotForm";
import UpdatePasswordForm from "./auth/UpdatePasswordForm";

interface AuthScreenProps {
  initialMode?: "signIn" | "signUp" | "forgot" | "updatePassword";
}

const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = "signIn" }) => {
  const [mode, setMode] = useState<AuthScreenProps["initialMode"]>(initialMode);

  switch (mode) {
    case "signUp":
      return <RegisterForm onLoginClick={() => setMode("signIn")} />;
    case "forgot":
      return <ForgotForm onLoginClick={() => setMode("signIn")} />;
    case "updatePassword":
      return <UpdatePasswordForm onLoginClick={() => setMode("signIn")} />;
    case "signIn":
    default:
      return (
        <LoginForm
          onRegisterClick={() => setMode("signUp")}
          onForgotClick={() => setMode("forgot")}
        />
      );
  }
};

export default AuthScreen;
