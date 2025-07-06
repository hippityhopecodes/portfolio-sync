# PortfolioSync - Investment Portfolio Aggregator

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
├── backend/
│ ├── api/
│ │ ├── init.py
│ │ ├── fidelity.py
│ │ ├── kraken.py
│ │ └── webull.py
│ ├── models/
│ │ ├── init.py
│ │ └── portfolio.py
│ ├── utils/
│ │ ├── init.py
│ │ └── auth.py
│ └── main.py
├── frontend/
│ ├── static/
│ │ ├── css/
│ │ └── js/
│ └── templates/
│ └── index.html
├── tests/
│ ├── test_api.py
│ └── test_models.py
└── config.py
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