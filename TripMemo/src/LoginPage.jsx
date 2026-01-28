// updated: add Login and signup pages
// LoginPage.jsx
import React, { useState } from "react";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { FaApple, FaFacebook } from "react-icons/fa";
import styles from "./LoginPage.module.css";

// Import images
import loginImage from "./assets/login_img.png";
import signupImage from "./assets/signup_img.png";

export default function LoginPage({ onLogin, onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const login = async (email, userName, password) => {
    const fd = new FormData();
    fd.append("email", email);
    fd.append("username", userName);
    fd.append("password", password);
    console.log(fd.email)
    console.log(Object.fromEntries(fd.entries()));// testing

    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      body: fd,
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Login failed");

    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if ((!email && !userName) || !password) {
      alert("Enter username or email, and password");
      return;
    }

  try {
  const data = await login(email, userName, password);
  console.log (data.username);
  onLogin(data.username);
} catch (err) {
  alert(err.message);
}
  };





















  return (
    <div className="app-root">
      <div className="phone-shell">
        <div className="phone-inner auth-phone-inner">
          {/* Illustration Section */}
          <div className="auth-illustration">
            <div className="auth-hero-image">
              <img
                src={loginImage}
                alt="Welcome"
                className="auth-illustration-img"
              />
            </div>
          </div>

          {/* Form Section */}
          <div className="auth-form-container">
            <h1 className="auth-form-title">Welcome back!</h1>

            <form
              className="auth-form-content login-form"
              onSubmit={handleSubmit}
            >
              <div className="auth-input-wrapper">
                <label className="auth-label">Email address</label>
                <input
                  type="email"
                  placeholder="yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-text-input"
                />
              </div>

              <div className="auth-input-wrapper">
                <label className="auth-label">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-text-input"
                  />
                  <button
                    type="button"
                    className="password-eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="auth-extras">
                <button type="button" className="forgot-link">
                  Forgot password?
                </button>
                <label className="remember-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
              </div>

              {/* Spacer to match signup form height */}
              <div className="login-spacer"></div>

              <button type="submit" className="auth-submit-btn">
                Log In
              </button>
            </form>

            <div className="auth-divider-line">
              <span>or</span>
            </div>

            <div className="social-auth-buttons">
              <button className="social-auth-btn">
                <FcGoogle size={24} />
              </button>
              <button className="social-auth-btn">
                <FaFacebook size={24} color="#1877F2" />
              </button>
              <button className="social-auth-btn">
                <FaApple size={24} />
              </button>
            </div>

            <p className="auth-switch-text">
              Don't have an account yet?{" "}
              <button onClick={onSwitchToSignup} className="auth-switch-btn">
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// SignupPage.jsx
export function SignupPage({ onSignup, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    onSignup();
  };

  return (
    <div className="app-root">
      <div className="phone-shell">
        <div className="phone-inner auth-phone-inner">
          {/* Illustration Section */}
          <div className="auth-illustration signup-illustration">
            <div className="auth-hero-image">
              <img
                src={signupImage}
                alt="Create Account"
                className="auth-illustration-img"
              />
            </div>
          </div>

          {/* Form Section */}
          <div className="auth-form-container">
            <h1 className="auth-form-title">Create Account</h1>

            <form className="auth-form-content" onSubmit={handleSubmit}>
              <div className="auth-input-wrapper">
                <label className="auth-label">Full name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-text-input"
                />
              </div>

              <div className="auth-input-wrapper">
                <label className="auth-label">Email address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-text-input"
                />
              </div>

              <div className="auth-input-wrapper">
                <label className="auth-label">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-text-input"
                  />
                  <button
                    type="button"
                    className="password-eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="auth-input-wrapper">
                <label className="auth-label">Confirm Password</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="auth-text-input"
                  />
                  <button
                    type="button"
                    className="password-eye-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn">
                Sign Up
              </button>
            </form>

            <div className="auth-divider-line">
              <span>or</span>
            </div>

            <div className="social-auth-buttons">
              <button className="social-auth-btn">
                <FcGoogle size={24} />
              </button>
              <button className="social-auth-btn">
                <FaFacebook size={24} color="#1877F2" />
              </button>
              <button className="social-auth-btn">
                <FaApple size={24} />
              </button>
            </div>

            <p className="auth-switch-text">
              Already have an account?{" "}
              <button onClick={onSwitchToLogin} className="auth-switch-btn">
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
