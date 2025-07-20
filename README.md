# Portfolio Sync

A real-time portfolio tracking application that aggregates investment data from multiple brokers and displays live market values with gains/losses. Built with vanilla JavaScript and hosted on GitHub Pages.

## 🚀 Live Demo

Visit the live application: [https://hippityhopecodes.github.io/portfolio-sync/src/frontend/](https://hippityhopecodes.github.io/portfolio-sync/src/frontend/)

## ✨ Features

- **Multi-Broker Support**: Tracks investments across Fidelity, Webull, and Kraken
- **Real-Time Pricing**: Live market prices from multiple financial APIs
- **Google Sheets Integration**: Direct CSV data import from Google Sheets
- **Account Tracking**: Supports different account types (Roth IRA, CMA, Trading, etc.)
- **Interactive Charts**: Visual portfolio allocation and broker breakdown
- **Responsive Design**: Works on desktop and mobile devices
- **Automatic Calculations**: Real-time gain/loss calculations and percentages

## 📊 Supported Assets

- **Stocks**: NVDA, AAPL, GOOGL, MSFT, and more
- **ETFs**: SPY, QQQ, VTI, VOO, and others  
- **Mutual Funds**: Fidelity funds (FSKAX, FTIHX, etc.)
- **Cryptocurrencies**: BTC, ETH, XRP, DOGE via CoinGecko API

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js for interactive visualizations
- **APIs**: 
  - Financial Modeling Prep (stock prices)
  - Twelvedata (stock market data)
  - Finnhub (financial data)
  - CoinGecko (cryptocurrency prices)
  - Yahoo Finance (via CORS proxy)
- **Data Source**: Google Sheets CSV export
- **Hosting**: GitHub Pages

## 📁 Project Structure

```
portfolio-sync/
├── src/frontend/
│   ├── static/
│   │   ├── css/
│   │   │   ├── style.css
│   │   │   └── dark-theme.css
│   │   └── js/
│   │       ├── api.js          # Core API and data fetching
│   │       ├── charts.js       # Chart.js visualizations
│   │       └── main.js         # UI updates and app initialization
│   └── templates/
│       └── index.html          # Main application interface
├── api/
│   └── index.py               # Unused Vercel serverless function
├── tests/                     # Test files
└── README.md
```

## 🔧 Setup Instructions

### 1. Google Sheets Configuration

1. Create a Google Sheet with your portfolio data
2. Use these formats for different brokers:

**Fidelity Format** (4 columns):
```
Account,Symbol,Quantity,Cost Basis
Roth IRA,FSKAX,0.127,20.29
CMA,FTIHX,0.628,10.00
```

**Webull/Kraken Format** (3 columns):
```
Symbol,Quantity,Cost Basis
NVDA,0.14206,22.95
BTC,0.0004329,50.43
```

3. Make your Google Sheet public (Share → Anyone with link can view)
4. Get the sheet ID from the URL and GIDs for each sheet tab

### 2. Update Configuration

Edit `src/frontend/static/js/api.js` and update:

```javascript
SHEET_ID: 'YOUR_GOOGLE_SHEET_ID',
SHEET_URLS: {
    fidelity: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0',
    webull: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=YOUR_WEBULL_GID',
    kraken: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=YOUR_KRAKEN_GID'
}
```

### 3. API Keys (Optional)

For higher rate limits and better reliability, get free API keys:

- **Finnhub**: [finnhub.io](https://finnhub.io/) (replace 'demo' in getFinnhubPrice)
- **Alpha Vantage**: [alphavantage.co](https://www.alphavantage.co/) (replace 'demo' in getAlphaVantagePrice)
- **Twelvedata**: [twelvedata.com](https://twelvedata.com/) (replace 'demo' in getTwelveDataPrice)

### 4. Deploy to GitHub Pages

1. Fork this repository
2. Update the configuration with your sheet details
3. Enable GitHub Pages in repository settings
4. Access your portfolio at: `https://yourusername.github.io/portfolio-sync/src/frontend/`

## 💡 Usage

1. **Add Holdings**: Update your Google Sheets with current positions
2. **View Portfolio**: The app automatically fetches live prices and calculates values
3. **Monitor Performance**: Track gains/losses across all brokers in real-time
4. **Analyze Allocation**: Use interactive charts to visualize portfolio distribution

## 📈 Example Portfolio Display

```
Total Portfolio Value: $249.81
Total Cost Basis: $130.78
Total Gain: $119.03 (91.01%)

By Broker:
├── Fidelity: $30.30 (2 positions)
├── Webull: $24.49 (1 position)  
└── Kraken: $84.52 (3 positions)
```

## 🔄 API Fallback System

The application uses a robust fallback system for price fetching:

1. **Financial Modeling Prep** (primary)
2. **Twelvedata** (backup)
3. **Finnhub** (backup)
4. **Yahoo Finance** (via CORS proxy)
5. **Alpha Vantage** (backup)
6. **Mock Prices** (final fallback)

## 🛡️ Privacy & Security

- **No Server Storage**: All data stays in your Google Sheets
- **Client-Side Only**: No backend server or database
- **Public APIs**: Uses free, public financial APIs
- **No Personal Data**: Only investment symbols and quantities are processed

## 🚧 Known Limitations

- **API Rate Limits**: Free API tiers have request limits
- **Market Hours**: Some APIs may have delayed data outside trading hours
- **Browser Cache**: May need hard refresh (Ctrl+F5) to see updates
- **CORS Restrictions**: Some financial APIs require proxy services

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Chart.js** for beautiful, responsive charts
- **CoinGecko** for reliable cryptocurrency data
- **Financial APIs** for real-time market data
- **GitHub Pages** for free hosting
