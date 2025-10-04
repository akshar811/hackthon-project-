# CYsafe - Advanced Cybersecurity Analysis Platform

A comprehensive cybersecurity web platform similar to VirusTotal with advanced analysis capabilities.

## Features

### Core Features
- **File Upload Scanner**: Scan files (PDF, EXE, APK, MOD, DOCX, ZIP) with multiple engines
- **URL Analyzer**: Detect phishing/malware URLs
- **Threat Reports**: Show detection results with risk levels (Safe, Suspicious, Malicious)
- **File Hashing**: Generate MD5, SHA256 for malware detection
- **Dashboard**: Scan history & comprehensive reports

### Advanced Analyzers
- **Email Analyzer**: Detect phishing, spoofing, spam, blacklisted domains
- **APK & MOD Analyzer**: Extract permissions, detect malware signatures
- **Password Strength Checker**: Entropy analysis with breach checking

## Tech Stack

- **Frontend**: React.js, Next.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **APIs**: VirusTotal, HaveIBeenPwned, ClamAV
- **Deployment**: Docker, AWS/Vercel

## Quick Start

```bash
# Clone repository
git clone <repo-url>
cd cysafe-platform

# Install dependencies
npm run install-all

# Start development
npm run dev

# Build for production
npm run build

# Deploy with Docker
docker-compose up -d
```

## Architecture

```
Frontend (React/Next.js) → API Gateway → Backend Services → MongoDB
                                    ↓
                            External APIs (VirusTotal, etc.)
```

## Security Features

- JWT Authentication
- Rate Limiting
- Secure File Handling
- Auto-deletion after 24h
- Input validation & sanitization