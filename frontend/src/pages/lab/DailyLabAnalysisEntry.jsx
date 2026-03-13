import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/base.css';
import '../../styles/DailyLabAnalysisEntry.css';

const MENU_ITEMS = [
  { label: 'Prmary/Mixed/Last Mil/Clarified Juice Unsulph/Sulph Syrup Bagasse Pol/Moist Press Cake', path: '/Lab/DailyLabAnalysisView' },
  { label: 'A Massecuite', path: '/Lab/AMassecuiteView' },
  { label: 'A1 Massecuite', path: '/Lab/A1MassecuiteView' },
  { label: 'B Massecuite', path: '/Lab/BMassecuiteView' },
  { label: 'C Massecuite', path: '/Lab/CMassecuiteView' },
  { label: 'C1 Massecuite', path: '/Lab/C1MassecuiteView' },
  { label: 'R1', path: '/Lab/R1View' },
  { label: 'R2', path: '/Lab/R2View' },
  { label: 'A/B Heavy A/C Light Final/Melt', path: '/Lab/MolassesAnalysisView' },
  { label: 'B/C Magma', path: '/Lab/BcMagmaView' }
];

const Lab_DailyLabAnalysisEntry = () => {
  const navigate = useNavigate();

  return (
    <div className="daily-lab-entry-page">
      <section className="daily-lab-entry-card">
        <header className="daily-lab-entry-header">
          <h1>Daily Analysis Entry</h1>
        </header>

        <div className="daily-lab-entry-body">
          <div className="daily-lab-entry-menu">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.path}
                type="button"
                className="daily-lab-entry-button"
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))}

            <button
              type="button"
              className="daily-lab-entry-button"
              onClick={() => navigate(-1)}
            >
              Exit
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Lab_DailyLabAnalysisEntry;
