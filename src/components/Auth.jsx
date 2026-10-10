import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

function Auth() {
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage(
          "Registrasi berhasil. Silakan cek email untuk konfirmasi akun."
        );
        setName("");
        setEmail("");
        setPassword("");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <div className="logo-icon">R</div>

          <div>
            <h1>Ruang Kita</h1>
            <span>Community Forum</span>
          </div>
        </div>

        <div className="auth-heading">
          <h2>
            {isRegister ? "Buat Akun Baru" : "Selamat Datang"}
          </h2>

          <p>
            {isRegister
              ? "Bergabung dengan komunitas Ruang Kita."
              : "Masuk untuk melanjutkan ke Ruang Kita."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {isRegister && (
            <div className="form-group">
              <label>Nama Lengkap</label>

              <input
                type="text"
                placeholder="Nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="auth-message auth-error">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Memproses..."
              : isRegister
                ? "Daftar"
                : "Masuk"}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? (
            <>
              Sudah punya akun?
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError("");
                  setMessage("");
                }}
              >
                Masuk
              </button>
            </>
          ) : (
            <>
              Belum punya akun?
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError("");
                  setMessage("");
                }}
              >
                Daftar
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default Auth;