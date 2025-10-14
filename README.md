# VLSM Calculator

A modern, browser-based **Variable Length Subnet Masking (VLSM) Calculator** designed to quickly generate efficient IP subnetting tables from a CIDR block and subnet requirements.

> 🛠 Built with HTML, CSS, and vanilla JavaScript. No frameworks. No build tools. Just fast and clean subnetting.

---

## 📦 Features

- 📥 Accepts a base CIDR block (e.g. `172.16.0.0` and mask or prefix).
- 🧮 Calculates subnets dynamically based on number of required hosts.
- ➕➖ Add/remove subnet inputs on the fly.
- 📋 Displays clean, subnetting table.
- 🕊 Spreadsheet copy 'n paste friendly.

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/safesploitOrg/vlsm-calculator.git
cd vlsm-calculator
```

### 2. Open in Browser

```bash
# Just double-click
index.html
```

Or serve with Python:

```bash
python3 -m http.server 8000
# Then visit: http://localhost:8000
```

---

## 🧠 Background

VLSM allows efficient IP address allocation by letting each subnet use a different prefix length depending on the number of hosts. This tool helps visualise and plan VLSM schemes interactively.

---

## 👨‍💻 Author

GitHub: [@safesploitOrg](https://github.com/safesploitOrg)  
Original Author: [@JCPedroza](https://github.com/JCPedroza/vlsm-table-generator)