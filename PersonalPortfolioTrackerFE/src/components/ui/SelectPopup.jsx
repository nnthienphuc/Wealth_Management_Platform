import React from "react";

function toKey(s = "") {
  return String(s)
    .toLowerCase()
    .normalize("NFD")                 // tách dấu
    .replace(/[\u0300-\u036f]/g, "")  // bỏ dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim();
}

export default function SelectPopup({
  open,
  title,
  rows = [],
  onSelect,
  onClose,
  placeholder = "Tìm theo tên...",
  showId = true,   // nếu không cần cột ID thì set false
}) {
  const [keyword, setKeyword] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!keyword) return rows;
    const k = toKey(keyword);
    return rows.filter((x) => {
      const byName = toKey(x.name).includes(k);
      // nếu muốn chỉ tìm theo tên: return byName;
      // nếu muốn cả ID (phòng khi cần): 
      const byId = toKey(x.id).includes(k);
      return byName || byId;
    });
  }, [rows, keyword]);

  if (!open) return null;

  return (
    <div className="modal show fade d-block" tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="d-flex gap-2 mb-3">
              <input
                className="form-control"
                placeholder={placeholder}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                autoFocus
              />
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    {showId && <th style={{ width: 260 }}>ID</th>}
                    <th>Tên</th>
                    <th style={{ width: 100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={showId ? 3 : 2} className="text-center">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item.id}>
                        {showId && (
                          <td style={{ wordBreak: "break-all" }}>{item.id}</td>
                        )}
                        <td>{item.name}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => onSelect(item)}
                          >
                            Chọn
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
}
