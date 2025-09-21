// App.jsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
import RouteScrollToTop from "./helper/RouteScrollToTop";

// === Auth wrappers ===
import { AuthProvider } from "./auth/AuthProvider.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import RequireSchool from "./auth/RequireSchool.jsx";

// === Pages ===
import HomePageOne from "./pages/HomePageOne";
import CreateSchoolPage from "./pages/CreateSchoolPage";
import InviteDriverPage from "./pages/InviteDriverPage";
import ErrorPage from "./pages/ErrorPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import InviteSuccessPage from "./pages/InviteSuccessPage";

import DriverRoutesPage from "./pages/DriverRoutesPage";



// (optional) Forgot password – if you have it, uncomment the import & route
// import ForgotPasswordPage from "./pages/ForgotPasswordPage";

// Helper to wrap a protected element (login + school required)
const secure = (el) => (
  <RequireAuth>
    <RequireSchool>{el}</RequireSchool>
  </RequireAuth>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RouteScrollToTop />
        <Routes>
          {/* ===== PUBLIC (ONLY auth pages) ===== */}
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/invite-success" element={<InviteSuccessPage />} />
          
          {/* <Route path="/forgot-password" element={<ForgotPasswordPage />} /> */}

          {/* ===== PROTECTED ROOT (login + school required) ===== */}
          <Route path="/" element={secure(<HomePageOne />)} />
          <Route path="/invite-driver" element={secure(<InviteDriverPage />)} />
          <Route path="/routes" element={secure(<DriverRoutesPage />)} />


          {/* Create School: must be logged in, school not required */}
          <Route
            path="/create-school"
            element={
              <RequireAuth>
                <CreateSchoolPage />
              </RequireAuth>
            }
          />

          {/* 404 */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
