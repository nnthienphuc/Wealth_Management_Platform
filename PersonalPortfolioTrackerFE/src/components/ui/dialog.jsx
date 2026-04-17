export function Dialog({ children, open, onOpenChange }) {
  return open ? <div className="dialog-backdrop">{children}</div> : null;
}

export function DialogContent({ children }) {
  return <div className="dialog-content">{children}</div>;
}

export function DialogHeader({ children }) {
  return <div className="dialog-header">{children}</div>;
}

export function DialogTitle({ children }) {
  return <h3>{children}</h3>;
}

export function DialogFooter({ children }) {
  return <div className="dialog-footer">{children}</div>;
}

export function Button({ onClick, children }) {
  return <button onClick={onClick} className="btn btn-primary">{children}</button>;
}