export function getAccountAccentLineStyle(account) {
  return {
    background: `linear-gradient(90deg, transparent 0%, ${account.accent} 50%, transparent 100%)`,
  };
}

export function getAccountInputStyle(account) {
  return {
    borderColor: `${account.accent}18`,
  };
}

export function getAccountPrimaryButtonStyle(account) {
  return {
    background: `linear-gradient(90deg, ${account.accent}1c 0%, ${account.accent}10 26%, transparent 58%), var(--button-primary-bg)`,
    border: `1px solid ${account.accent}2a`,
    color: "var(--button-primary-text)",
    boxShadow: "var(--button-primary-shadow)",
  };
}

export function getAccountSecondaryButtonStyle(account) {
  return {
    background: `linear-gradient(90deg, ${account.accent}10 0%, transparent 54%), var(--button-outline-bg)`,
    border: `1px solid ${account.accent}16`,
    color: "var(--button-outline-text)",
    boxShadow: "var(--button-outline-shadow)",
  };
}

export function getAccountCardOutlineStyle(account, outlineAlpha = "14") {
  return {
    boxShadow: `0 18px 34px rgba(0,0,0,0.2), inset 0 0 0 1px ${account.accent}${outlineAlpha}`,
  };
}

export function getAccountMessageStyle(account) {
  return {
    background: `linear-gradient(135deg, ${account.accentSoft} 0%, rgba(18,22,28,0.94) 72%)`,
    border: `1px solid ${account.accent}26`,
    boxShadow: "0 14px 28px rgba(0,0,0,0.2)",
  };
}

export function getAccountHeaderActionStyle(account) {
  return {
    background: `linear-gradient(90deg, ${account.accent}18 0%, ${account.accent}0d 24%, transparent 56%), var(--button-primary-bg)`,
    border: `1px solid ${account.accent}24`,
    color: "var(--button-primary-text)",
    boxShadow: "var(--button-primary-shadow)",
  };
}

export function getAccountMetaBadgeStyle(account) {
  return {
    background: `linear-gradient(135deg, ${account.accentSoft} 0%, rgba(255,255,255,0.04) 100%)`,
    border: `1px solid ${account.accent}26`,
  };
}

export function getAccountTableHeaderStyle(account) {
  return {
    background: `linear-gradient(90deg, ${account.accent}12 0%, ${account.accent}08 24%, transparent 54%), var(--table-head-gradient)`,
    color: "var(--table-head-text)",
  };
}

export function getAccountTableFooterStyle(account) {
  return {
    background: `linear-gradient(180deg, ${account.accentSoft} 0%, rgba(255,255,255,0.03) 100%)`,
  };
}

export function getAccountSettlementRowStyle(account) {
  return {
    background: `linear-gradient(90deg, ${account.accentSoft} 0%, rgba(255,255,255,0.03) 100%)`,
  };
}

export function getAccountEditButtonStyle(account) {
  return {
    color: account.accent,
    background: `${account.accent}10`,
  };
}

export function getAccountModalShellStyle(account) {
  return {
    border: `1px solid ${account.accent}1c`,
  };
}

export function getAccountModalGlowStyle(account) {
  return {
    background: `radial-gradient(circle, ${account.accentSoft} 0%, transparent 72%)`,
  };
}
