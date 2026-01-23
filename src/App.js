// App.jsx
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import RouteScrollToTop from "./helper/RouteScrollToTop";

// === Auth wrappers ===
import { AuthProvider } from "./auth/AuthProvider.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import RequireSchool from "./auth/RequireSchool.jsx";
import { ToastProvider } from "./components/Toast.jsx";

// === Pages ===
import HomePageOne from "./pages/HomePageOne";
import InviteDriverPage from "./pages/InviteDriverPage";
import ErrorPage from "./pages/ErrorPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import InviteSuccessPage from "./pages/InviteSuccessPage";

import DriverRoutesPage from "./pages/DriverRoutesPage";
import SchoolQRPage from "./pages/SchoolQRPage";
import SchoolsPage from "./pages/SchoolsPage";




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
        <ToastProvider>
        <RouteScrollToTop />
        <Routes>
          {/* ===== PUBLIC (ONLY auth pages) ===== */}
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/invite-success" element={<InviteSuccessPage />} />
          <Route path="/school/:schoolId" element={<SchoolQRPage />} />

          
          {/* <Route path="/forgot-password" element={<ForgotPasswordPage />} /> */}

          {/* ===== PROTECTED ROOT (login + school required) ===== */}
          <Route path="/" element={secure(<HomePageOne />)} />
          <Route path="/schools" element={secure(<SchoolsPage />)} />
          <Route path="/invite-driver" element={secure(<InviteDriverPage />)} />
          <Route path="/routes" element={secure(<DriverRoutesPage />)} />


          {/* Create Company route - redirect to home since companies are auto-created */}
          <Route path="/create-company" element={<Navigate to="/" replace />} />

          {/* 404 */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
