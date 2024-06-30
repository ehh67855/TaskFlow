import { Outlet, useRoutes } from "react-router-dom";
import LayoutPage from "src/layout/LayoutPage";
import App from "./App";
import NotFound from "src/notFound/NotFound";
import Login from "src/login/Login";
import RegisterPage from "src/register/RegisterPage";
import ForgotPassword from "src/ForgotPassword/ForgotPassword";
import PasswordReset from "src/ForgotPassword/PasswordReset";
import ActivateAccount from "src/register/ActivateAccount";
import SignupConfirmation from "src/register/SignupConfirmation";
import NetworkPage from "src/network/NetworkPage";
import EditProfile from "src/register/EditProfile";
import EditProfileConfirmation from "src/register/EditProfileConfirmation";
import JsonFormatExplainer from "src/network/JsonFormatExplainer";
import SessionTimeout from "./SessionTimeout";

const AppRoutes = () => {
  let routes = useRoutes([
    {
      path: '/',
      element: <LayoutPage><Outlet /></LayoutPage>, // Wrap Outlet inside LayoutPage
      children: [
        { index: true, element: <App /> },
        { path: 'login', element: <Login /> },
        { path: 'forgot-password', element: <ForgotPassword /> },
        { path: 'register', element: <RegisterPage /> },
        { path: 'reset-password', element: <PasswordReset /> },
        { path: 'activate-account', element: <ActivateAccount /> },
        { path: 'signup-confirmation', element: <SignupConfirmation /> },
        { path: 'edit-profile', element: <EditProfile /> },
        { path: 'edit-profile-confirmation', element: <EditProfileConfirmation /> },
        { path: 'session-timeout', element: <SessionTimeout /> },
        { path: '*', element: <NotFound /> }
      ]
    },
    {
      path: '/network/:id',
      element: <NetworkPage />
    }
  ]);
  return routes;
};

  
export default AppRoutes;