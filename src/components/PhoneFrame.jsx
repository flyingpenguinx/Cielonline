export default function PhoneFrame({ children, className = "" }) {
  return (
    <div className={`phone-shell ${className}`.trim()}>
      <div className="phone-notch" />
      <div className="phone-screen">{children}</div>
    </div>
  );
}
