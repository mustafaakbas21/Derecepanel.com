/**
 * Giriş başarılı olunca #dpLoginExit — lib/auth/login-exit.ts ile tetiklenir.
 */
export function LoginExitOverlay() {
  return (
    <div id="dpLoginExit" className="dp-login-exit" aria-hidden="true" inert>
      <div className="dp-login-exit__scrim" aria-hidden="true" />
      <div className="dp-login-exit__panel">
        <p className="dp-login-exit__brand">Derecepanel</p>
        <p className="dp-login-exit__msg">Panele bağlanıyor</p>
        <div className="dp-login-exit__track" aria-hidden="true">
          <div className="dp-login-exit__bar" />
        </div>
      </div>
    </div>
  );
}
