import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { addBudgetService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';
import '../../styles/AddBudgetview.css';

const Lab_AddBudgetview = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('0');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    masterService
      .getUnits()
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        setUnits(list);
      })
      .catch(() => {
        if (mounted) setUnits([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const unitOptions = useMemo(
    () =>
      units.map((u, idx) => ({
        code: String(u?.f_Code ?? u?.F_Code ?? u?.id ?? ''),
        name: String(u?.F_Name ?? u?.f_Name ?? u?.name ?? `Unit ${idx + 1}`)
      })),
    [units]
  );

  const loadData = async (factoryCode = selectedUnit) => {
    setLoading(true);
    try {
      const payload = await addBudgetService.getList({
        WB_Factory: factoryCode
      });
      const list = Array.isArray(payload?.data) ? payload.data : [];
      setRows(list);
      if (!list.length) toast.error('No Record Available');
    } catch (error) {
      setRows([]);
      toast.error(error?.response?.data?.message || 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData('0');
  }, []);

  return (
    <div className="abv-page">
      <Toaster position="top-right" />
      <div className="page-card">
        <div className="page-card-header abv-title">Weekly Budget View</div>
        <div className="page-card-body">
          <div className="abv-panel">
            <div className="abv-panel-body">
              <div className="abv-filter-grid">
                <div className="form-group">
                  <label>Units</label>
                  <select className="form-control" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                    <option value="0">All</option>
                    {unitOptions.map((u, idx) => (
                      <option key={`${u.code}-${idx}`} value={u.code}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="abv-actions">
                <button className="btn btn-primary" onClick={() => loadData(selectedUnit)} disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/Lab/AddBudget')}>
                  Add New
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/Lab/LabDashboard')}>
                  Exit
                </button>
              </div>

              <div className="abv-table-wrap">
                <table className="abv-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>F_Code</th>
                      <th>Budget Amount</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length ? (
                      rows.map((item, index) => {
                        const rowKey = `${item?.WB_ID ?? 'row'}-${item?.WB_Factory ?? ''}-${index}`;
                        return (
                          <tr key={rowKey}>
                            <td>
                              <button
                                type="button"
                                className="abv-link"
                                onClick={() => navigate(`/Lab/AddBudget?WB_Id=${item.WB_ID}&f_Code=${item.WB_Factory}`)}
                              >
                                {item.WB_ID}
                              </button>
                            </td>
                            <td>{item.WB_Factory}</td>
                            <td>{item.WB_BudgetAmount}</td>
                            <td>{item.WB_FromDate}</td>
                            <td>{item.WB_ToDate}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="abv-empty" colSpan={5}>
                          {loading ? 'Loading...' : 'No Record Available'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lab_AddBudgetview;



