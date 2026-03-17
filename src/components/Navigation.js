// src/components/Navigation.js
// Tab bar — Dashboard | Update Balances | Charts | Forecast

export function Navigation({ currentView, onViewChange, hasStaleAccounts }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "update", label: "Update Balances" },
    { id: "charts", label: "Charts" },
    { id: "forecast", label: "Forecast" },
  ];

  return (
    <div style={{
      borderBottom: "0.5px solid #e0e0e0",
      marginBottom: "2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div style={{ display: "flex" }}>
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              style={{
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: isActive ? "500" : "400",
                color: isActive ? "#185FA5" : "#888",
                background: "transparent",
                border: "none",
                borderBottom: isActive ? "2px solid #185FA5" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-0.5px",
              }}
            >
              {tab.label}
              {tab.id === "update" && hasStaleAccounts && (
                <span style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#BA7517",
                  marginLeft: "6px",
                  verticalAlign: "middle",
                }} />
              )}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: "12px", color: "#bbb", margin: 0 }}>
        Finance dashboard
      </p>
    </div>
  );
}
