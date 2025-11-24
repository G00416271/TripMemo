// src/SideMenu.jsx

function SideMenu({ isOpen, onClose }) {
  return (
    <div
      className={`side-menu-overlay ${isOpen ? "open" : ""}`}
      onClick={onClose}
    >
      <div
        className="side-menu"
        onClick={(e) => e.stopPropagation()} // don't close when clicking inside
      >
        <div className="side-menu-header">
          <img
            className="side-menu-avatar"
            src="https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png"
            alt="Profile"
          />
          <div>
            <p className="side-menu-name">Hello, User</p>
            <p className="side-menu-email">user@gmail.com</p>
          </div>
        </div>

        <div className="side-menu-section">
          <p className="side-menu-section-title">Account</p>
          <button className="side-menu-item">Profile</button>
          <button className="side-menu-item">Settings</button>
        </div>

        <div className="side-menu-section">
          <p className="side-menu-section-title">App</p>
          <button className="side-menu-item">Privacy &amp; Security</button>
          <button className="side-menu-item">Help &amp; Support</button>
        </div>

        <div className="side-menu-section">
          <button className="side-menu-item danger">Log out</button>
        </div>
      </div>
    </div>
  );
}

export default SideMenu;
