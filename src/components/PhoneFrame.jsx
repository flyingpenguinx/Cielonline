export default function PhoneFrame({ children, className = "" }) {
  return (
    <div className={`phone-shell ${className}`.trim()}>
      <div className="phone-top-bar">
        <div className="phone-notch">
          <div className="phone-camera" />
        </div>
      </div>
      <div className="phone-screen">{children}</div>
      <div className="phone-home-indicator" />
    </div>
  );
}
