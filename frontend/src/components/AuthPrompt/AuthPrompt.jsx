import { useNavigate } from "react-router-dom";
import "./AuthPrompt.css";

function AuthPrompt({
  open,
  onClose,
  returnPath = "/products",
  pendingAction = null,
}) {
  const navigate = useNavigate();

  if (!open) {
    return null;
  }

  const handleLogin = () => {
    navigate("/login", {
      state: {
        returnPath,
        pendingAction,
      },
    });
  };

  const handleRegister = () => {
    navigate("/register", {
      state: {
        returnPath,
        pendingAction,
      },
    });
  };

  return (
    <div
      className="auth-prompt-overlay"
      onClick={onClose}
    >
      <div
        className="auth-prompt"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="auth-prompt-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="auth-prompt-icon">
          R
        </div>

        <span className="auth-prompt-eyebrow">
        SHOPEASE ACCOUNT
        </span>

        <h2>
          Sign in to continue
        </h2>

        <p>
          Log in to your existing account
          or create a new account to
          continue shopping.
        </p>

        <div className="auth-prompt-actions">

          <button
            type="button"
            className="auth-prompt-login"
            onClick={handleLogin}
          >
            Login
            <span>→</span>
          </button>

          <button
            type="button"
            className="auth-prompt-register"
            onClick={handleRegister}
          >
            Create Account
          </button>

        </div>

        <button
          type="button"
          className="auth-prompt-cancel"
          onClick={onClose}
        >
          Continue browsing
        </button>

      </div>
    </div>
  );
}

export default AuthPrompt;