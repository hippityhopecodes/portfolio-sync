# PortfolioSync - Investment Portfolio Manager

A unified dashboard that aggregates investment data from Fidelity, Kraken, and Webull into a dark-themed interface. Built with Python, FastAPI, and modern web technologies.

## Features

- Real-time portfolio tracking across platforms
- Dark mode responsive UI 
- Interactive financial charts
- Secure API key management
- Historical performance tracking
- Data export capabilities
- Multi-currency support

## Structure
```
portfoliosync/
├── src/
│   ├── backend/
│   │   ├── __init__.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── fidelity.py    # Fidelity API integration
│   │   │   ├── kraken.py      # Kraken API integration
│   │   │   └── webull.py      # Webull API integration
│   │   ├── portfolio_manager.py  # Main logic for managing all APIs
│   │   ├── config.py          # API keys and configuration
│   │   └── main.py           # FastAPI application
│   │
│   └── frontend/
│       ├── static/
│       │   ├── css/
│       │   │   ├── style.css      # Main styles
│       │   │   └── dark-theme.css # Dark theme styles
│       │   ├── js/
│       │   │   ├── api.js         # API calls to backend
│       │   │   ├── charts.js      # Chart.js setup and updates
│       │   │   └── main.js        # Main frontend logic
│       │   └── img/
│       │       └── favicon.ico
│       └── templates/
│           └── index.html     # Single page application
│
├── tests/
│   ├── __init__.py
│   ├── test_api/
│   │   ├── test_fidelity_api.py
│   │   ├── test_kraken_api.py
│   │   └── test_webull_api.py
│   └── test_portfolio_manager.py
│
├── .env                  # Environment variables (API keys)
├── requirements.txt      # Python dependencies
└── README.md
```

## Installation
```bash
git clone https://github.com/hippityhopecodes/portfoliosync.git
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

## Run the App
```bash 
python backend/main.py
python -m http.server 8000 # Serve frontend
```

## API Setup
```python
# Add to .env file:
FIDELITY_API_KEY="your_key"
KRAKEN_API_KEY="your_key"
WEBULL_API_KEY="your_key"
```

## Tech Stack

Backend:
- Python 3.8+
- FastAPI
- SQLite/PostgreSQL

Frontend:  
- HTML/CSS/JavaScript
- Chart.js

## Security
- JWT Authentication
- API Key Encryption
- Rate Limiting
- CORS Protection

## Testing
```bash
pytest tests/
npm test
```

## Future Enhancements
- [ ] Mobile app version
- [ ] Additional platforms
- [ ] Advanced analytics
- [ ] Portfolio optimization
- [ ] Email notifications
- [ ] Two-factor auth

## Acknowledgments
- FastAPI
- Chart.js
- Kraken/Fidelity/Webull APIs

---
