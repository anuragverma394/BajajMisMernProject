import React, { useState, useEffect, useCallback, useMemo, useDeferredValue, startTransition, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { masterService, dashboardService } from "../microservices/api.service";
import "../styles/Dashboard_1.css";

const FACTORY_COLORS = ["#129a81", "#3490dc", "#f6993f", "#e3342f", "#9561e2", "#38c172", "#f66d9b"];
const BRAND_COLOR = "#1F9E8A";
const DEFAULT_DASHBOARD_RANGE_DAYS = 15;
const PAGE_SIZE = 10;
const CURRENT_YEAR = new Date().getFullYear();

const EXPORT_ACTIONS = [
  { type: "fullscreen", label: "View in full screen" },
  { type: "print", label: "Print chart", shaded: true },
  { divider: true },
  { type: "png", label: "Download PNG image" },
  { type: "jpeg", label: "Download JPEG image" },
  { type: "svg", label: "Download SVG vector image" },
  { divider: true },
  { type: "csv", label: "Download CSV" },
  { type: "xls", label: "Download XLS" },
  { type: "table", label: "View data table" }
];

export default function Dashboard() {
  const [filterType, setFilterType] = useState("marketing");
  const [filterFactory, setFilterFactory] = useState("0");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [factoriesList, setFactoriesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [caneCrushData, setCaneCrushData] = useState({ MyList: [], DateList: [] });
  const [yeastOvershoots, setYeastOvershoots] = useState([]);
  const [tokenGrossTare, setTokenGrossTare] = useState([]);
  const [purchaseOvershoots, setPurchaseOvershoots] = useState([]);

  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(0);
  const [p3, setP3] = useState(0);
  const [p4, setP4] = useState(0);
  const [openMenuKey, setOpenMenuKey] = useState("");
  const initialFetchDoneRef = useRef(false);

  const deferredCaneCrushData = useDeferredValue(caneCrushData);
  const deferredYeastOvershoots = useDeferredValue(yeastOvershoots);
  const deferredTokenGrossTare = useDeferredValue(tokenGrossTare);
  const deferredPurchaseOvershoots = useDeferredValue(purchaseOvershoots);

  const paginate = (data, page) => {
    if (!data || !Array.isArray(data)) return [];
    return data.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  };

  const normalizeChartRows = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    return [];
  };

  const dedupeFactories = (items = []) => {
    const seen = new Set();
    const out = [];
    items.forEach((item, idx) => {
      const code = String(item?.F_Code ?? item?.f_Code ?? item?.id ?? "").trim();
      const key = code || `idx-${idx}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(item);
    });
    return out;
  };

  const normalizeSeries = (list = []) => {
    const merged = new Map();
    const counts = new Map();

    list.forEach((series, idx) => {
      const baseName = String(series?.name ?? "").trim() || `Series ${idx + 1}`;
      counts.set(baseName, (counts.get(baseName) || 0) + 1);
      const data = Array.isArray(series?.data) ? series.data : [];
      if (!merged.has(baseName)) {
        merged.set(baseName, data.map((v) => Number(v) || 0));
        return;
      }
      const prev = merged.get(baseName);
      const len = Math.max(prev.length, data.length);
      const next = Array.from({ length: len }, (_, i) => (Number(prev[i]) || 0) + (Number(data[i]) || 0));
      merged.set(baseName, next);
    });

    return Array.from(merged.entries()).map(([name, data]) => ({
      name: counts.get(name) > 1 ? `${name} (merged)` : name,
      data
    }));
  };

  const normalizeCrushPayload = (value) => {
    const raw = value?.data ?? value ?? {};
    return {
      MyList: normalizeSeries(Array.isArray(raw.MyList) ? raw.MyList : []),
      DateList: Array.isArray(raw.DateList) ? raw.DateList : []
    };
  };

  const buildFactoryCodeList = (items = []) => {
    const codes = items
      .map((row) => String(row?.F_Code ?? row?.f_Code ?? row?.id ?? "").trim())
      .filter(Boolean);
    return codes.join(",");
  };

  const allFactoryCodes = useMemo(() => buildFactoryCodeList(factoriesList), [factoriesList]);
  const resolveFactoryCode = (selected) => {
    if (!selected || selected === "0") return allFactoryCodes || "";
    return selected;
  };

  const loadDashboardData = useCallback(async ({ dateFrom, dateTo, factoryCode, type }) => {
    const params = { dateFrom, dateTo, factoryCode, type };
    const crushCall =
      type === "marketing"
        ? dashboardService.getMarketingData(params)
        : dashboardService.getSurveyData(params);

    const [crush, yeast, token] = await Promise.allSettled([
      crushCall,
      dashboardService.getYeastOvershoots(params),
      dashboardService.getTokenGrossTare(params)
    ]);

    let msg = "";

    startTransition(() => {
      if (crush.status === "fulfilled") {
        setCaneCrushData(normalizeCrushPayload(crush.value));
      } else {
        setCaneCrushData({ MyList: [], DateList: [] });
        msg =
          crush.reason?.response?.data?.message ||
          crush.reason?.message ||
          "Failed to load cane crush data";
      }

      if (yeast.status === "fulfilled") {
        setYeastOvershoots(normalizeChartRows(yeast.value));
      } else {
        setYeastOvershoots([]);
        msg =
          msg ||
          yeast.reason?.response?.data?.message ||
          yeast.reason?.message ||
          "Failed to load overshoot data";
      }

      if (token.status === "fulfilled") {
        setTokenGrossTare(normalizeChartRows(token.value));
      } else {
        setTokenGrossTare([]);
        msg =
          msg ||
          token.reason?.response?.data?.message ||
          token.reason?.message ||
          "Failed to load token/gross/tare data";
      }

      if (yeast.status === "fulfilled") {
        setPurchaseOvershoots(normalizeChartRows(yeast.value));
      } else {
        setPurchaseOvershoots([]);
      }

      setErrorMessage(msg);
    });
  }, []);

  useEffect(() => {
    const loadFactories = async () => {
      const data = await masterService.getUnits();
      const unitsArray = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      const cleaned = dedupeFactories(unitsArray);
      setFactoriesList(cleaned);
      return cleaned;
    };

    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - DEFAULT_DASHBOARD_RANGE_DAYS);

    const formatLocal = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const dFrom = formatLocal(pastDate);
    const dTo = formatLocal(today);
    setFilterDateFrom(dFrom);
    setFilterDateTo(dTo);

    const doInitialFetch = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const units = await loadFactories();
        const factoryCode = buildFactoryCodeList(units);
        await loadDashboardData({
          dateFrom: dFrom,
          dateTo: dTo,
          factoryCode,
          type: "marketing"
        });
        initialFetchDoneRef.current = true;
      } catch (err) {
        console.error(err);
      }
      setIsLoading(false);
    };

    doInitialFetch();
  }, [loadDashboardData]);

  const fetchData = async (overrideType = null) => {
    setIsLoading(true);
    setErrorMessage("");
    setP1(0);
    setP2(0);
    setP3(0);
    setP4(0);

    const currentType = overrideType || filterType;
    if (overrideType) {
      setFilterType(overrideType);
    }

    try {
        await loadDashboardData({
          dateFrom: filterDateFrom,
          dateTo: filterDateTo,
          factoryCode: resolveFactoryCode(filterFactory),
          type: currentType
        });
    } catch (err) {
      console.error(err);
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const setTypeAndFetch = (type) => {
    setFilterType(type);
    fetchData(type);
  };

  useEffect(() => {
    if (!initialFetchDoneRef.current) return;
    if (!filterDateFrom || !filterDateTo) return;
    if (filterFactory !== "0") return;
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [filterFactory, filterDateFrom, filterDateTo, filterType]);

  const caneCrushRows = useMemo(() => {
    return (deferredCaneCrushData.DateList || []).map((date, i) => {
      const row = { label: date, categoryKey: `${date}-${i}` };
      (deferredCaneCrushData.MyList || []).forEach((f) => {
        row[f.name] = f.data[i];
      });
      return row;
    });
  }, [deferredCaneCrushData]);

  const yeastBarData = useMemo(
    () =>
      deferredYeastOvershoots.map((d, idx) => ({
        categoryKey: `${d.F_Name || d.Factory || d.c_name || "Factory"}-${idx}`,
        name: d.F_Name || d.Factory || d.c_name || `Factory ${idx + 1}`,
        Normal: d.ctogateMinute || 0,
        Overshoot: d.diff || 0
      })),
    [deferredYeastOvershoots]
  );

  const tokenBarData = useMemo(
    () =>
      deferredTokenGrossTare.map((d, idx) => ({
        categoryKey: `${d.F_Name || d.F_name || d.c_name || "Factory"}-${idx}`,
        name: d.F_Name || d.F_name || d.c_name || `Factory ${idx + 1}`,
        TokenToGross: d.TGM || 0,
        TokenToGrossOS: d.TGOvs || 0,
        GrossToTare: d.GTrM || 0,
        GrossToTareOS: d.GTOvs || 0,
        TokenToTare: d.TTM || 0,
        TokenToTareOS: d.TTOvs || 0
      })),
    [deferredTokenGrossTare]
  );

  const purchaseBarData = useMemo(() => {
    return (deferredPurchaseOvershoots || []).map((d, idx) => ({
      categoryKey: `${d.F_Name || d.Factory || d.name || "Factory"}-${idx}`,
      name: d.F_Name || d.Factory || d.name || `Factory ${idx + 1}`,
      TargetLimit: d.TargetLimit ?? d.ctogateMinute ?? 0,
      ActualValue: d.ActualValue ?? d.AvgMint ?? d.avgmint ?? 0
    }));
  }, [deferredPurchaseOvershoots]);

  const centreGateRatioData = useMemo(
    () =>
      deferredYeastOvershoots.map((d, idx) => ({
        categoryKey: `${d.F_Name || d.Factory || d.c_name || "Factory"}-${idx}`,
        name: d.F_Name || d.Factory || d.c_name || `Factory ${idx + 1}`,
        Ratio: d.ctogateMinute
          ? parseFloat(((d.AvgMint || d.avgmint || 0) / d.ctogateMinute).toFixed(2))
          : 0,
        Target: 1
      })),
    [deferredYeastOvershoots]
  );

  const avgTravelHoursData = useMemo(
    () =>
      yeastBarData.map((item) => ({
        ...item,
        NormalHours: Number(item.Normal || 0) / 60,
        OvershootHours: Number(item.Overshoot || 0) / 60
      })),
    [yeastBarData]
  );

  const tokenTrendData = useMemo(
    () =>
      tokenBarData.map((item) => ({
        ...item,
        Token: item.TokenToGross,
        Gross: item.GrossToTare,
        Tare: item.TokenToTare
      })),
    [tokenBarData]
  );

  const renderPager = (setPage, totalItems) => (
    <div className="dashboard-pager">
      <button onClick={() => setPage(0)}>First</button>
      <button onClick={() => setPage((prev) => Math.max(0, prev - 1))}>Prev</button>
      <button
        onClick={() =>
          setPage((prev) => ((prev + 1) * PAGE_SIZE < totalItems ? prev + 1 : prev))
        }
      >
        Next
      </button>
      <button
        onClick={() => setPage(Math.floor((Math.max(totalItems, 1) - 1) / PAGE_SIZE))}
      >
        Last
      </button>
    </div>
  );

  const handleExport = (chartId, type, title, dataContext) => {
    const el = document.getElementById(chartId);
    if (!el) return;

    setOpenMenuKey("");

    if (type === "fullscreen") {
      if (el.requestFullscreen) el.requestFullscreen();
      return;
    }

    if (type === "print") {
      const printWindow = window.open("", "", "width=900,height=700");
      if (!printWindow) return;
      printWindow.document.write(`<html><body>${el.innerHTML}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      return;
    }

    if (type === "png" || type === "jpeg" || type === "svg") {
      const svg = el.querySelector("svg");
      if (!svg) return;
      const svgData = new XMLSerializer().serializeToString(svg);
      if (type === "svg") {
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title}.svg`;
        link.click();
        return;
      }
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width + 30;
        canvas.height = img.height + 30;
        if (!ctx) return;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 15, 15);
        const url = canvas.toDataURL(type === "jpeg" ? "image/jpeg" : "image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title}.${type}`;
        link.click();
      };
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
      return;
    }

    if ((type === "csv" || type === "xls") && Array.isArray(dataContext) && dataContext.length > 0) {
      const keys = Object.keys(dataContext[0]);
      const csvContent =
        "data:text/csv;charset=utf-8," +
        keys.join(",") +
        "\n" +
        dataContext.map((e) => keys.map((k) => e[k]).join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${title}.${type}`);
      link.click();
      return;
    }

    if (type === "table") {
      window.alert("View data table feature is in development.");
    }
  };

  const renderExportMenu = (menuKey, chartId, title, dataContext) => (
    <div className="dashboard-menu-wrap">
      <button
        onClick={() => setOpenMenuKey((prev) => (prev === menuKey ? "" : menuKey))}
        className="dashboard-menu-btn"
      >
        Menu
      </button>
      {openMenuKey === menuKey ? (
        <div className="dashboard-menu-dropdown">
          {EXPORT_ACTIONS.map((action, idx) => {
            if (action.divider) {
              return <div key={`divider-${idx}`} className="dashboard-menu-divider" />;
            }
            return (
              <div
                key={action.type}
                onClick={() => handleExport(chartId, action.type, title, dataContext)}
                className={`dashboard-menu-item${action.shaded ? " shaded" : ""}`}
              >
                {action.label}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  const renderPanelHeader = (colorClass, title, menuKey, chartId, exportTitle, dataContext) => (
    <div className={`dashboard-panel-head ${colorClass}`}>
      <span>{title}</span>
      {renderExportMenu(menuKey, chartId, exportTitle, dataContext)}
    </div>
  );

  return (
    <div className="dashboard-screen">
      <div className="dashboard-filter-shell">
        <div className="dashboard-filter-row">
          <div className="dashboard-type-switch">
            <button
              onClick={() => setTypeAndFetch("marketing")}
              className={`dashboard-type-btn ${filterType === "marketing" ? "active" : ""}`}
            >
              Marketing
            </button>
            <button
              onClick={() => setTypeAndFetch("survey")}
              className={`dashboard-type-btn ${filterType === "survey" ? "active" : ""}`}
            >
              Survey
            </button>
          </div>

          <div className="dashboard-grow" />

          <select value={filterFactory} onChange={(e) => setFilterFactory(e.target.value)} className="dashboard-input dashboard-select">
            <option value="0">Select Factory</option>
            {factoriesList.map((f, idx) => (
              <option key={`${f.F_Code}-${idx}`} value={f.F_Code}>
                {f.F_Name}
              </option>
            ))}
          </select>

          <div className="dashboard-date-wrap">
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="dashboard-input"
            />
            <span>to</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="dashboard-input"
            />
          </div>

          <button
            onClick={() => fetchData()}
            disabled={isLoading || filterFactory === "0"}
            className="dashboard-search-btn"
          >
            {isLoading ? "..." : "Search"}
          </button>
        </div>
      </div>

      {errorMessage ? <div className="dashboard-error">{errorMessage}</div> : null}

      <div className="dashboard-content">
        {filterType === "marketing" ? (
          <>
            <div className="dashboard-panel dashboard-panel-main">
              {renderPanelHeader("teal", "Cane Crush", "menu-main", "chart-main", "Cane_Crush", caneCrushRows)}
              <div id="chart-main" className="dashboard-chart-area chart-main">
                <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={300}>
                  <LineChart data={caneCrushRows}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fill: "#697586", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#697586", fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    {(caneCrushData.MyList || []).map((f, index) => (
                      <Line
                        key={`${f.name}-${index}`}
                        type="monotone"
                        dataKey={f.name}
                        stroke={FACTORY_COLORS[index % FACTORY_COLORS.length]}
                        dot={false}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dashboard-grid two-col">
              <div className="dashboard-panel">
                {renderPanelHeader("blue", "Travel Time Overshoots [Centre To Gate]", "menu-grid1", "chart-grid1", "Travel_Time", yeastBarData)}
                <div id="chart-grid1" className="dashboard-chart-area chart-sub">
                  <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={240}>
                    <BarChart data={paginate(yeastBarData, p1)}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Bar dataKey="Normal" fill="#2f9e44" />
                      <Bar dataKey="Overshoot" fill="#e03131" />
                    </BarChart>
                  </ResponsiveContainer>
                  {renderPager(setP1, yeastBarData.length)}
                </div>
              </div>

              <div className="dashboard-panel">
                {renderPanelHeader("darkteal", "Token/Gross/Tare[Overshoots]-Receipt", "menu-grid2", "chart-grid2", "Token_Gross", tokenBarData)}
                <div id="chart-grid2" className="dashboard-chart-area chart-sub">
                  <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={240}>
                    <BarChart data={paginate(tokenBarData, p2)}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Bar dataKey="TokenToGross" fill="#2f9e44" />
                      <Bar dataKey="TokenToGrossOS" fill="#e03131" />
                      <Bar dataKey="GrossToTare" fill="#1971c2" />
                      <Bar dataKey="GrossToTareOS" fill="#f08c00" />
                      <Bar dataKey="TokenToTare" fill="#845ef7" />
                      <Bar dataKey="TokenToTareOS" fill="#5c3d2e" />
                    </BarChart>
                  </ResponsiveContainer>
                  {renderPager(setP2, tokenBarData.length)}
                </div>
              </div>

              <div className="dashboard-panel">
                {renderPanelHeader("red", "Purchase Overshoot", "menu-grid3", "chart-grid3", "Purchase_Overshoot", purchaseBarData)}
                <div id="chart-grid3" className="dashboard-chart-area chart-sub">
                  <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={240}>
                    <BarChart data={paginate(purchaseBarData, p3)}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Bar dataKey="TargetLimit" fill="#2f9e44" />
                      <Bar dataKey="ActualValue" fill="#e03131" />
                    </BarChart>
                  </ResponsiveContainer>
                  {renderPager(setP3, purchaseBarData.length)}
                </div>
              </div>

              <div className="dashboard-panel">
                {renderPanelHeader("pink", "Centre To Gate Ratio", "menu-grid4", "chart-grid4", "Centre_Gate_Ratio", centreGateRatioData)}
                <div id="chart-grid4" className="dashboard-chart-area chart-sub">
                  <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={240}>
                    <LineChart data={paginate(centreGateRatioData, p4)}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Line type="monotone" dataKey="Ratio" stroke="#1c7ed6" dot={false} strokeWidth={2} />
                      <Line
                        type="monotone"
                        dataKey="Target"
                        stroke="#e03131"
                        dot={false}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  {renderPager(setP4, centreGateRatioData.length)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="dashboard-panel dashboard-panel-main">
              {renderPanelHeader("purple", "Survey", "menu-survey-main", "chart-survey-main", "Survey_Area", caneCrushRows)}
              <div id="chart-survey-main" className="dashboard-chart-area chart-main">
                <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={300}>
                  <LineChart data={caneCrushRows}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#7194d8" />
                    <XAxis dataKey="label" tick={{ fill: "#697586", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#697586", fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    {(caneCrushData.MyList || []).map((f, index) => (
                      <Line
                        key={`${f.name}-${index}`}
                        type="monotone"
                        dataKey={f.name}
                        stroke={FACTORY_COLORS[index % FACTORY_COLORS.length]}
                        dot={false}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dashboard-grid three-col">
              <div className="dashboard-panel">
                {renderPanelHeader("blue", "Travel Time Overshoot For Centres", "menu-survey-1", "chart-survey-1", "Travel_Time_Survey", yeastBarData)}
                <div id="chart-survey-1" className="dashboard-chart-area chart-survey-sub">
                  <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={240}>
                    <BarChart data={paginate(yeastBarData, p1)}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Bar dataKey="Normal" fill="#2f9e44" />
                      <Bar dataKey="Overshoot" fill="#e03131" />
                    </BarChart>
                  </ResponsiveContainer>
                  {renderPager(setP1, yeastBarData.length)}
                </div>
              </div>

              <div className="dashboard-panel">
                {renderPanelHeader("green", "Token", "menu-survey-2", "chart-survey-2", "Token_Survey", tokenTrendData)}
                <div id="chart-survey-2" className="dashboard-chart-area chart-survey-sub">
                  <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={240}>
                    <LineChart data={paginate(tokenTrendData, p2)}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Line type="monotone" dataKey="Token" stroke="#0b7285" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="Gross" stroke="#1971c2" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="Tare" stroke="#f08c00" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                  {renderPager(setP2, tokenTrendData.length)}
                </div>
              </div>

              <div className="dashboard-panel">
                {renderPanelHeader("red", "Centre/Gate qty purchased", "menu-survey-3", "chart-survey-3", "Centre_Gate_Qty", purchaseBarData)}
                <div id="chart-survey-3" className="dashboard-chart-area chart-survey-sub">
                  <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={240}>
                    <BarChart data={paginate(purchaseBarData, p3)}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Bar dataKey="TargetLimit" fill="#2f9e44" />
                      <Bar dataKey="ActualValue" fill="#e03131" />
                    </BarChart>
                  </ResponsiveContainer>
                  {renderPager(setP3, purchaseBarData.length)}
                </div>
              </div>
            </div>

            <div className="dashboard-grid two-col">
              <div className="dashboard-panel">
                {renderPanelHeader("darkteal", "Token/Gross/Tare[Overshoots Hours]", "menu-survey-4", "chart-survey-4", "Token_Gross_Tare_Hours", tokenBarData)}
                <div id="chart-survey-4" className="dashboard-chart-area chart-survey-sub">
                  <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={240}>
                    <BarChart data={paginate(tokenBarData, p4)}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Bar dataKey="TokenToGrossOS" fill="#2f9e44" />
                      <Bar dataKey="GrossToTareOS" fill="#1971c2" />
                      <Bar dataKey="TokenToTareOS" fill="#e03131" />
                    </BarChart>
                  </ResponsiveContainer>
                  {renderPager(setP4, tokenBarData.length)}
                </div>
              </div>

              <div className="dashboard-panel">
                {renderPanelHeader("pink", "Average Travel Overshoot Hours", "menu-survey-5", "chart-survey-5", "Average_Travel_Overshoot_Hours", avgTravelHoursData)}
                <div id="chart-survey-5" className="dashboard-chart-area chart-survey-sub">
                  <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={240}>
                    <LineChart data={avgTravelHoursData}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Line type="monotone" dataKey="NormalHours" stroke="#1c7ed6" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="OvershootHours" stroke="#e03131" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="dashboard-footer">
        {CURRENT_YEAR} © Bajaj Hindusthan Sugar Ltd. All Rights Reserved. Designed & Developed By {" "}
        <span>Vibrant IT Solutions Pvt. Ltd.</span>
      </footer>
    </div>
  );
}

